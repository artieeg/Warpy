import { CommonSubjectEventMap } from "./common";
import { ConsumerSubjectEventMap } from "./consumer_node";
import { ProducerSubjectEventMap } from "./producer_node";

export const SubjectEventMap = {
  ...ConsumerSubjectEventMap,
  ...ProducerSubjectEventMap,
  ...CommonSubjectEventMap,
};

export * from "./consumer_node";
export * from "./producer_node";
