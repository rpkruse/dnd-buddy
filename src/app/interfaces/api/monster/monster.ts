export interface Monster {
    id: number,
    name: string,
    max_HP: number, //hit_points + roll(hit_dice)
    hp: number, //current hp
    gameId: number,
    url: string
}