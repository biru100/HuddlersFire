import { isSeated } from './camp-seats.mjs';
// Personal display filtering never edits players, chat history or shared physics.
export const visiblePlayers = (players,self,hiddenIds=[]) => {
  const hidden=isSeated(self)?new Set(hiddenIds):new Set();
  return players.filter(p=>p.mapId===self?.mapId && (p.id===self.id||!hidden.has(p.id)));
};
export function fireConversation(chat,now,hiddenIds=[]) {
  const hidden=new Set(hiddenIds);
  return chat.filter(e=>e.kind==='chat'&&e.mapId==='camp'&&!hidden.has(e.by)&&e.at<=now&&now-e.at<12000).slice(-3);
}
