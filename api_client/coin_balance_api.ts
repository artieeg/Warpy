import { ICoinBalanceResponse } from "@warpy/lib";
import { WebSocketConn } from "./connection";

export interface ICoinBalanceAPI {
  get: () => Promise<ICoinBalanceResponse>;
}

export const CoinBalanceAPI = (socket: WebSocketConn): ICoinBalanceAPI => ({
  get: () => socket.request("get-coin-balance", {}),
});