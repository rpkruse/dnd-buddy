export interface Monster {
    monsterId: number,
    name: string,
    max_HP: number, //hit_points + roll(hit_dice)
    hp: number, //current hp
    cr: number,
    gameId: number,
    url: string
}