export namespace Table {
  export interface Expl {
    id: number;
    created_at: string;
    user_id: number;
    key: string;
    value: string | null;
    tg_content?: TgContents;
    echo_count: number;
    last_echo: string | null;
  }

  export interface TgContents {
    content_id: number;
    message_id?: number;
    chat_id?: number;
    sticker_id?: string;
    audio_id?: string;
    photo_id?: string;
    video_id?: string;
  }

  export interface Auth {
    id: number;
    tg_user_id: number;
    tg_group_id: number;
  }
}

export namespace Options {
  export interface Telegram {
    message?: number;
    chat?: number;
    sticker?: string;
    audio?: string;
    photo?: string;
    video?: string;
  }

  export interface Expl {
    userId: number;
    key: string;
    message?: string;
    telegram?: Telegram
  }
}
