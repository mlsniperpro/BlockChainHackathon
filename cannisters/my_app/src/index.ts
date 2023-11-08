import {
  Canister,
  query,
  text,
  update,
  Void,
  Record,
  Vec,
  nat64,
  Opt,
  StableBTreeMap,
  Variant,
  Result,
  ic,
  None,
  Ok,
  Err,
} from "azle";
import { v4 as uuidv4 } from "uuid";
const MessagePayload = Record({
  title: text,
  body: text,
  attachment: text,
});

//Message model
const Message = Record({
  id: text,
  title: text,
  body: text,
  attachment: text,
  createdAt: nat64,
  updatedAt: Opt(nat64),
});

const messageStorage = StableBTreeMap(text, Message, 0);

const Error = Variant({
  NotFound: text,
  InvalidPayload: text,
});
export default Canister({
  addMessage: update([MessagePayload], Result(Message, Error), (payload) => {
    const message = {
      id: uuidv4(),
      createdAt: ic.time(),
      updatedAt: None,
      ...payload,
    };
    messageStorage.insert(message.id, message);
    return Ok(message);
  }),
  getMessages: query([], Result(Vec(Message), Error), () => {
    return Ok(messageStorage.values());
  }),
  getMessage: query([text], Result(Message, Error), (id) => {
    const messageRequested = messageStorage.get(id);
    if ("None" in messageRequested) {
      return Err({ NotFound: "Message with ${id} not found}" });
    }

    return Ok(messageRequested.Some);
  }),

  updateMessage: update(
    [text, MessagePayload],
    Result(Message, Error),
    (id, payload) => {
      const messageRequested = messageStorage.get(id);
      if ("None" in messageRequested) {
        return Err({ NotFound: "Message with ${id} not found}" });
      }
      const message = messageRequested.Some;
      const updatedMessage = {
        ...message,
        ...payload,
        updatedAt: ic.time(),
      };
      messageStorage.insert(id, updatedMessage);
      return Ok(updatedMessage);
    }
  ),

  deleteMessage: update([text], Result(Message, Error), (id) => {
    const messageRequested = messageStorage.remove(id);
    if ("None" in messageRequested) {
      return Err({ NotFound: "Message with ${id} not found}" });
    }
    return Ok(messageRequested.Some);
  }),
});

globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
};
