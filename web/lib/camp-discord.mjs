export const DISCORD_MESSAGES = {
  'discord-linked': 'Discord 프로필 사진을 연결했어요.',
  'discord-cancelled': 'Discord 연결을 취소했어요.',
  'discord-expired': '인증 시간이 지났어요. 다시 연결해 주세요.',
  'discord-unconfigured': 'Discord 연결을 준비하고 있어요. 지금은 게스트로 참여할 수 있어요.',
  'discord-failed': 'Discord 연결을 마치지 못했어요. 다시 시도해 주세요.',
};
export function isDiscordCompletion(event, origin, popup) {
  return !!popup && event.origin === origin && event.source === popup && event.data?.type === 'camp-discord-complete' && typeof event.data.notice === 'string' &&
    Object.hasOwn(DISCORD_MESSAGES, event.data.notice);
}
