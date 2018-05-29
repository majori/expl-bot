declare namespace Table {
  export interface Expl {
    id: number;
    created_at: string;
    key: string;
    value: string | null;
    tg_user_id: number;
    tg_username: string;
    tg_message_id: number | null;
    tg_chat_id: number;
    echo_count: number;
    last_echo: string | null;
  }

  export interface Auth {
    id: number;
    tg_user_id: number;
    tg_group_id: number;
  }
}
