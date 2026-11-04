import { MEMBER_TTL, HOST_LEASE, CLEANUP_INTERVAL, RTC_STALE, MAX_UNCONFIRMED_HANDOFFS } from './camp-config.mjs';

// Compare camp time, not wall-clock age: a shared outage must not disqualify every survivor.
const eligible = `m.room = camp_rooms.code AND m.id != camp_rooms.host AND m.seen > ? AND
  (camp_rooms.recovery_epoch = 0 OR (m.ready = 1 AND m.snapshot_epoch = camp_rooms.recovery_epoch AND m.snapshot_time >= camp_rooms.recovery_time - ${RTC_STALE}))`;

export async function maintainRoom(db, code, now, force = false) {
  let room = await db.prepare('SELECT * FROM camp_rooms WHERE code = ?').bind(code).first();
  if (!room || (!force && room.cleanup_after > now && room.lease_until > now)) return room;
  await db.batch([
    db.prepare('DELETE FROM camp_members WHERE room = ? AND seen <= ?').bind(code, now - MEMBER_TTL),
    db.prepare(`UPDATE camp_rooms SET host = (SELECT m.id FROM camp_members m WHERE ${eligible} ORDER BY m.ready DESC, m.joined, m.id LIMIT 1),
      epoch = epoch + 1, lease_until = ?, handoffs = handoffs + 1 WHERE code = ? AND
      (handoffs < ${MAX_UNCONFIRMED_HANDOFFS} OR (SELECT COUNT(*) FROM camp_members WHERE room = camp_rooms.code AND seen > ?) = 1) AND
      (lease_until <= ? OR NOT EXISTS (SELECT 1 FROM camp_members WHERE id = camp_rooms.host)) AND
      EXISTS (SELECT 1 FROM camp_members m WHERE ${eligible})`)
      .bind(now - HOST_LEASE, now + HOST_LEASE, code, now - HOST_LEASE, now, now - HOST_LEASE),
    db.prepare('DELETE FROM camp_rooms WHERE code = ? AND NOT EXISTS (SELECT 1 FROM camp_members WHERE room = ?)').bind(code, code),
    db.prepare('DELETE FROM camp_signals WHERE room = ? AND created < ?').bind(code, now - 120_000),
    db.prepare('UPDATE camp_rooms SET cleanup_after = ? WHERE code = ?').bind(now + CLEANUP_INTERVAL, code),
  ]);
  room = await db.prepare('SELECT * FROM camp_rooms WHERE code = ?').bind(code).first();
  return room;
}

export async function updatePresence(db, room, member, request, now) {
  const epoch = Number(request.recoveryEpoch || 0), seq = Number(request.recoverySeq ?? -1), at = Number(request.recoveryTime || 0);
  const valid = request.ready === '1' && Number.isSafeInteger(epoch) && epoch > 0 && epoch <= room.epoch &&
    (epoch === room.epoch || epoch === room.recovery_epoch) && Number.isSafeInteger(seq) && seq >= 0 && seq <= 1e12 && Number.isFinite(at) && at >= 0 && at <= 1e12;
  const advance = valid && (epoch > member.snapshot_epoch || (epoch === member.snapshot_epoch && seq >= member.snapshot_seq));
  const after = Number(request.after || 0);
  const statements = [db.prepare(`UPDATE camp_members SET seen = ?, ready = ?, snapshot_epoch = ?, snapshot_seq = ?, snapshot_time = ?, signal_after = MAX(signal_after, ?) WHERE id = ?`)
    .bind(now, valid ? 1 : 0, advance ? epoch : member.snapshot_epoch, advance ? seq : member.snapshot_seq, advance ? at : member.snapshot_time, after, member.id)];
  if (after > member.signal_after) statements.push(db.prepare('DELETE FROM camp_signals WHERE recipient = ? AND id <= ?').bind(member.id, after));
  if (valid && epoch === room.epoch && (epoch > room.recovery_epoch || seq > room.recovery_seq)) {
    statements.push(db.prepare(`UPDATE camp_rooms SET recovery_epoch = ?, recovery_seq = ?, recovery_time = ?, handoffs = 0 WHERE code = ? AND epoch = ? AND
      (recovery_epoch < ? OR (recovery_epoch = ? AND recovery_seq < ?)) AND
      (? != host OR NOT EXISTS (SELECT 1 FROM camp_members WHERE room = ? AND id != host AND seen > ?))`)
      .bind(epoch, seq, at, room.code, epoch, epoch, epoch, seq, member.id, room.code, now - HOST_LEASE));
  }
  if (request.renew === '1' && member.id === room.host && Number(request.epoch) === room.epoch) {
    statements.push(db.prepare('UPDATE camp_rooms SET lease_until = ? WHERE code = ? AND host = ? AND epoch = ?').bind(now + HOST_LEASE, room.code, member.id, room.epoch));
  }
  await db.batch(statements);
}
