//import { Participant } from "./participant";

import { IParticipant } from ".";

export interface IStream {
  id: string;
  owner: string | null;
  title: string;
  category: string;
  preview: string | null;
}

export interface ICandidate extends IStream {
  total_participants: number;
  speakers: IParticipant[];
}
