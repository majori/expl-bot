import * as me from '../events/me';
import type { Context } from '../../types/telegraf';

export async function startMe(ctx: Context) {
  const keyboard = await me.meKeyboard(ctx.from!.id);
  const texts = {
    navigate: await me.meText(ctx.from!.id, 'home'),
    stats: await me.statsText(ctx.from!),
  };

  await ctx.telegram.sendMessage(ctx.from!.id, texts.stats, {
    parse_mode: 'MarkdownV2',
  });

  await ctx.telegram.sendMessage(ctx.from!.id, texts.navigate, {
    reply_markup: keyboard,
  });
}
