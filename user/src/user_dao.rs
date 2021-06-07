use crate::errors::user_dao::AddUserError;
use crate::User;
use mongodb::{error::Error, options::ClientOptions, Client, Collection};

#[derive(Clone)]
pub struct UserDAO {
    collection: Collection<User>,
}

impl UserDAO {
    pub async fn new() -> Result<Self, Error> {
        let mongo_conn = std::env::var("MONGODB_CONN").unwrap();
        let options = ClientOptions::parse(mongo_conn.as_str()).await?;
        let client = Client::with_options(options)?;

        let db = client.database("warpy");

        Ok(Self {
            collection: db.collection_with_type::<User>("users"),
        })
    }

    pub async fn add_user(&self, user: User) -> Result<String, AddUserError> {
        match self.collection.insert_one(user, None).await {
            Ok(result) => Ok(result.inserted_id.to_string()),
            Err(_) => return Err(AddUserError {}),
        }
    }
}
