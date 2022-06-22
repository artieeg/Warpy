import { IChatMessage } from "@warpy/lib";
import { IStore } from "../../useStore";
import { AppState } from "../AppState";
import { StateUpdate } from "../types";

export interface MessageManager {
  clear: () => Promise<StateUpdate>;
  prependNewMessages: (messages: IChatMessage[]) => Promise<StateUpdate>;
}

export class MessageManagerImpl implements MessageManager {
  private state: AppState;

  constructor(state: IStore | AppState) {
    if (state instanceof AppState) {
      this.state = state;
    } else {
      this.state = new AppState(state);
    }
  }

  async clear() {
    this.state.update({
      messages: [],
    });

    return this.state.getStateDiff();
  }

  async prependNewMessages(messages: IChatMessage[]) {
    this.state.update({
      messages: [...messages, ...this.state.get().messages],
    });

    return this.state.getStateDiff();
  }
}