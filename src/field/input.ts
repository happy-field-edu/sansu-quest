// バーチャルスティックの入力を Scene の移動処理へ渡す共有バッファ。
// TouchStick が書き込み、Scene の useFrame が毎フレーム読む。
export const stick = { x: 0, z: 0 }
