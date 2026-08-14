import { driver } from './db'
import { generateBracket, shuffle, sortedGroups, toArray } from './bracket'
import type { BracketMode, Group, RoomState } from './types'
import type { GameConfig } from './games'

export const DEFAULT_GROUP_COUNT = 9

const groupId = (index: number) => `k${index + 1}`

export async function seedGroups(count = DEFAULT_GROUP_COUNT) {
  const groups: Record<string, Group> = {}
  for (let i = 0; i < count; i++) {
    groups[groupId(i)] = { id: groupId(i), name: `Kelompok ${i + 1}`, order: i }
  }
  await driver.set('groups', groups)
}

export async function addGroup(state: RoomState | null) {
  const existing = sortedGroups(state)
  let index = existing.length
  let id = groupId(index)
  while (state?.groups?.[id]) {
    index += 1
    id = groupId(index)
  }
  await driver.set(`groups/${id}`, {
    id,
    name: `Kelompok ${existing.length + 1}`,
    order: existing.length,
  })
}

export async function renameGroup(id: string, name: string) {
  await driver.set(`groups/${id}/name`, name)
}

export async function removeGroup(id: string) {
  await driver.set(`groups/${id}`, null)
}

/* ------------------------------- Fashion show ------------------------------ */

export function fashionOrder(state: RoomState | null): string[] {
  const stored = toArray<string>(state?.fashion?.order)
  const groups = sortedGroups(state).map((g) => g.id)
  const valid = stored.filter((id) => groups.includes(id))
  const missing = groups.filter((id) => !valid.includes(id))
  return [...valid, ...missing]
}

export async function setFashionOrder(order: string[]) {
  await driver.set('fashion/order', order)
}

export async function shuffleFashionOrder(state: RoomState | null) {
  await setFashionOrder(shuffle(fashionOrder(state)))
}

export async function moveFashionEntry(state: RoomState | null, id: string, delta: number) {
  const order = fashionOrder(state)
  const from = order.indexOf(id)
  const to = from + delta
  if (from < 0 || to < 0 || to >= order.length) return
  ;[order[from], order[to]] = [order[to], order[from]]
  await setFashionOrder(order)
}

export async function setFashionIndex(index: number) {
  await driver.set('fashion/currentIndex', Math.max(0, index))
}

export async function markFashionDone(groupIdValue: string, done: boolean) {
  await driver.set(`fashion/done/${groupIdValue}`, done ? true : null)
}

export async function resetFashion() {
  await driver.update({ 'fashion/currentIndex': 0, 'fashion/done': null })
}

/* ---------------------------------- Games --------------------------------- */

/** Daftar peserta sebuah lomba; default-nya semua kelompok + peserta tambahan. */
export function gameParticipants(state: RoomState | null, gameId: string): string[] {
  const game = state?.games?.[gameId]
  const groups = sortedGroups(state).map((g) => g.id)
  const extras = Object.keys(game?.extras ?? {})
  const stored = toArray<string>(game?.participants)
  if (stored.length) return stored.filter((id) => groups.includes(id) || extras.includes(id))
  return [...groups, ...extras]
}

export async function setGameParticipants(gameId: string, ids: string[]) {
  await driver.set(`games/${gameId}/participants`, ids)
}

export async function ensureExtras(game: GameConfig, state: RoomState | null) {
  if (!state) return
  if (state.games?.[game.id]?.extrasSeeded) return
  if (!game.defaultExtras.length) return
  const extras: Record<string, { id: string; name: string }> = {}
  game.defaultExtras.forEach((name, i) => {
    const id = `x_${game.id}_${i}`
    extras[id] = { id, name }
  })
  await driver.update({
    [`games/${game.id}/extras`]: extras,
    [`games/${game.id}/extrasSeeded`]: true,
  })
}

export async function addExtra(gameId: string, name: string) {
  const id = `x_${gameId}_${Date.now().toString(36)}`
  await driver.set(`games/${gameId}/extras/${id}`, { id, name })
}

export async function removeExtra(gameId: string, extraId: string, participants: string[]) {
  await driver.update({
    [`games/${gameId}/extras/${extraId}`]: null,
    [`games/${gameId}/participants`]: participants.filter((p) => p !== extraId),
  })
}

export async function createBracket(
  gameId: string,
  participants: string[],
  matchSize: number,
  mode: BracketMode,
) {
  const bracket = generateBracket(participants, matchSize, mode)
  await driver.update({
    [`games/${gameId}/participants`]: participants,
    [`games/${gameId}/bracket`]: bracket,
    [`games/${gameId}/focus`]: null,
  })
}

export async function clearBracket(gameId: string) {
  await driver.update({ [`games/${gameId}/bracket`]: null, [`games/${gameId}/focus`]: null })
}

export async function setWinner(
  gameId: string,
  roundIndex: number,
  matchIndex: number,
  participantId: string | null,
) {
  await driver.set(
    `games/${gameId}/bracket/rounds/${roundIndex}/matches/${matchIndex}/winner`,
    participantId,
  )
}

export async function assignSlot(
  gameId: string,
  roundIndex: number,
  matchIndex: number,
  slotKey: string,
  participantId: string | null,
) {
  await driver.set(
    `games/${gameId}/bracket/rounds/${roundIndex}/matches/${matchIndex}/slots/${slotKey}/pick`,
    participantId,
  )
}

export async function addSlot(
  gameId: string,
  roundIndex: number,
  matchIndex: number,
  nextKey: number,
) {
  await driver.set(
    `games/${gameId}/bracket/rounds/${roundIndex}/matches/${matchIndex}/slots/${nextKey}`,
    { pick: null, src: null },
  )
}

export async function removeSlot(
  gameId: string,
  roundIndex: number,
  matchIndex: number,
  slotKey: string,
) {
  await driver.set(
    `games/${gameId}/bracket/rounds/${roundIndex}/matches/${matchIndex}/slots/${slotKey}`,
    null,
  )
}

export async function setFocus(gameId: string, matchId: string | null) {
  await driver.set(`games/${gameId}/focus`, matchId)
}

export async function resetAll() {
  await driver.set('', { title: 'Lomba 17 Agustus' })
}
