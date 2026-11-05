export type MapId = 'camp' | 'playground' | 'showroom';
export type Motion = 'grounded' | 'airborne' | 'carried' | 'falling' | 'respawning';
export type FireState = { fuel:number; updatedAt:number; stokedAt:number; revision:number; xp:number; style:string };
export type BallState = { x: number; y: number; vx: number; vy: number; rotation: number };
export type Weapon = 'none' | 'gun' | 'snowball' | 'bomb';
export type Presence = { presence: string; statusText: string; workText: string; allowCall: boolean };
export type PlayerState = Presence & {
  seatId: string | null; lastStokeAt: number;
  mapId: MapId; mapRevision: number;
  lastCallAt: number; lastCalledAt: number;
  id: string; x: number; y: number; z: number; vx: number; vy: number; vz: number; motion: Motion;
  facing: number; aimX: number; aimY: number; sitting: boolean; crouching: boolean; moving: boolean; running: boolean; thrown: boolean;
  carrying: string | null; carriedBy: string | null; allowCarry: boolean; connected: boolean;
  emote: string | null; emoteUntil: number; bubble: string; bubbleUntil: number;
  jumpAt: number; landedAt: number; respawns: number; respawnAt: number;
  weapon: Weapon; nextShotAt: number; shotAt: number; shotAimX: number; shotAimY: number; hitAt: number;
};
export type Projectile = { id: string; owner: string; weapon: string; x: number; y: number; z: number; vx: number; vy: number; vz: number; bornAt: number; expiresAt: number };
export type WeaponEffect = { id: string; weapon: string; kind: string; x: number; y: number; z: number; at: number; expiresAt: number; radius: number };
export type WeaponWorld = { projectiles: Projectile[]; effects: WeaponEffect[]; sequence: number; at: number };
export type ChatEntry = { id: string; by: string; name: string; color: string; text: string; at: number; createdAt: number; mapId?: MapId; kind: 'chat' | 'call'; to?: string };
export type Track = { id: string; videoId: string; title?: string; by: string; name: string };
export type MusicState = { revision: number; transport: number; current: Track | null; queue: Track[]; playing: boolean; position: number; anchor: number };
export type WorldSnapshot = { t: 'state'; v: number; epoch: number; seq: number; now: number; players: PlayerState[]; fire:FireState; weapons: WeaponWorld; ball: BallState; checkpoint?: { chatId: string | null; musicRevision: number } };
export type RecoveryState = { world: WorldSnapshot; chat: ChatEntry[]; music: MusicState };
export type WireState = {
  t:'state'; v:number; epoch:number; seq:number; now:number;
  f?:unknown[][]; b?:number; d?:[string,unknown[]][]; r?:string[];
  h?:FireState; w?:WeaponWorld; u?:BallState; c?:WorldSnapshot['checkpoint'];
};
export type CampAction = { id: string } & (
  | { kind:'seat'; seatId:string }
  | { kind:'add-firewood' }
  | { kind:'fire-style'; style:string }
  | { kind: 'change-map'; mapId: MapId; portalId:string; mapRevision:number }
  | ({ kind: 'presence' } & Presence)
  | { kind: 'call'; target: string }
  | { kind: 'jump' | 'escape' }
  | { kind: 'posture'; posture: 'standing' | 'sitting' | 'crouching' }
  | { kind: 'emote'; emote: string }
  | { kind: 'lift'; target: string | null }
  | { kind: 'allow-carry'; allow: boolean }
  | { kind: 'equip'; weapon: Weapon }
  | { kind: 'fire'; dx: number; dy: number }
  | { kind: 'chat'; text: string }
  | { kind: 'music-add'; url: string; title?: string | null }
  | { kind: 'music-control'; op: 'play' | 'pause' | 'skip' | 'remove' | 'sync'; currentId?: string | null; position?: number; track?: string }
);
export type Member = { id: string; name: string; color: string; avatar?: string | null; joined?: number; active?: number };
export type SessionPhase = 'joining' | 'active' | 'recovering' | 'hosting' | 'closed';
