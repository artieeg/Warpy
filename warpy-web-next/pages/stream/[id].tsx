import React from "react";
import { View, StyleSheet } from "react-native";
import { NextPageContext } from "next";
import Head from "next/head";
import { runNATSRequest } from "../../modules/comms";
import { Store } from "@warpy/client";
import { StreamContent } from "../../modules/stream/content";

type StreamProps = {
  rid: string;
  id: string;
  initialStore: Store;
};

export default function Stream({ initialStore, id, rid }: StreamProps) {
  return (
    <View style={styles.wrapper}>
      <StreamContent id={id} rid={rid} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: "100%",
    backgroundColor: "#000",
  },
});

export async function getServerSideProps(context: NextPageContext) {
  const { id: streamId, rid } = context.query;

  const { stream } = await runNATSRequest("stream.get", {
    stream: streamId,
  });

  const store: Partial<Store> = {
    stream: stream.id,
    title: stream.title,
  };

  return {
    props: {
      id: stream.id,
      title: stream.title,
      description: "join this stream",
      initialStore: store,
      rid: rid ?? "",
    } as StreamProps,
  };
}
