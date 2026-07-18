// 手作り問題バンクの型とヘルパー。
// 正解は choices の先頭に書く（出題時にシャッフルするので、正解番号のミスが起きない）。

export interface BankProblem {
  skillId: string // 記録用（SKILLSの技能IDにあわせる）
  text: string
  choices: string[] // [正解, まちがい1, まちがい2, まちがい3]
  boss?: boolean // true = 大ボス用（総復習・やや難しめ）
}

// 通常問題
export const P = (skillId: string, text: string, correct: string, wrongs: [string, string, string]): BankProblem => ({
  skillId,
  text,
  choices: [correct, ...wrongs],
})

// 大ボス用問題（総復習）
export const B = (skillId: string, text: string, correct: string, wrongs: [string, string, string]): BankProblem => ({
  skillId,
  text,
  choices: [correct, ...wrongs],
  boss: true,
})
