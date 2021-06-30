use async_trait::async_trait;
use futures::StreamExt;
use lapin::{
    options::{BasicConsumeOptions, ExchangeDeclareOptions, QueueBindOptions, QueueDeclareOptions},
    types::FieldTable,
    Channel, Connection, ConnectionProperties, ExchangeKind,
};

use crate::amqp_handlers::BaseAMQPHandler;

#[async_trait]
pub trait AMQPClientExt {
    async fn connect(&mut self);
    async fn handle_user_request<T>(&mut self, handler: T)
    where
        T: BaseAMQPHandler + Send;
}

#[derive(Clone)]
pub struct AMQPClient {
    channel: Option<Channel>,
}

impl AMQPClient {
    pub fn new() -> Self {
        Self { channel: None }
    }

    fn get_channel(&self) -> &Channel {
        self.channel.as_ref().unwrap()
    }
}

#[async_trait]
impl AMQPClientExt for AMQPClient {
    async fn connect(&mut self) {
        let uri = std::env::var("AMQP_URI").unwrap();
        let connection = Connection::connect(&uri, ConnectionProperties::default())
            .await
            .expect("Connecting to AMQP service");

        self.channel = Some(connection.create_channel().await.expect("Create channel"));
    }

    async fn handle_user_request<T>(&mut self, handler: T)
    where
        T: BaseAMQPHandler + Send,
    {
        let channel = self.get_channel();
        channel
            .queue_declare(
                "user.request",
                QueueDeclareOptions::default(),
                FieldTable::default(),
            )
            .await
            .expect("user.request queue declare");

        let mut consume = channel
            .basic_consume(
                "user.request",
                "",
                BasicConsumeOptions::default(),
                FieldTable::default(),
            )
            .await
            .expect("Consuming user.request queue");

        while let Some(delivery) = consume.next().await {
            handler.handle_delivery(delivery);
        }
    }
}
