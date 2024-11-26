import { Context, Schema, Random } from 'koishi'
import {} from 'koishi-plugin-adapter-onebot'

export const name = 'muteme'

export interface Config {
  type: "随机时间" | "固定时间"
  time?: number
  maxtime?: number
  mintime?: number
  banMessage?: string
  enableBanMessage?: boolean
  mutehimEnable?: boolean // 是否启用 mutehim 功能
  mutehimProbability?: number // 禁言发起人的概率
  mutehimBanMessage?: string // 禁言提示，支持目标成员变量
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    type: Schema.union(['随机时间', '固定时间']).required().description('禁言模式'),
  }).description('禁言模式'),
  Schema.union([
    Schema.object({
      type: Schema.const('随机时间').required(),
      mintime: Schema.number().default(60).min(0).description('最小时间'),
      maxtime: Schema.number().default(600).min(0).description('最大时间'),
    }).description('禁言配置'),
    Schema.object({
      type: Schema.const('固定时间').required(),
      time: Schema.number().default(600).min(0).description('禁言时间'),
    }).description('禁言配置'),
  ]),
  Schema.object({
    banMessage: Schema.string().default("你已被禁言 {time} 秒！").description('禁言后的提示消息（支持 {time} 变量）'),
    enableBanMessage: Schema.boolean().default(true).description('是否启用禁言提示消息'),
  }).description('禁言提示配置'),
  Schema.object({
    mutehimEnable: Schema.boolean().default(false).description('是否启用 mutehim 功能'),
    mutehimProbability: Schema.number().default(0.5).min(0).max(1).description('禁言发起人的概率'),
    mutehimBanMessage: Schema.string().default("{name} 被禁言 {time} 秒！").description('禁言提示消息（支持 {name} 和 {time} 变量）'),
  }).description('mutehim 功能配置'),
])

export function apply(ctx: Context, config: Config) {
  const random = new Random(() => Math.random())

  // 指令 muteme
  ctx.command("muteme", "让机器人禁言你")
    .action(async ({ session }) => {
      let bantime = config.type === "固定时间"
        ? config.time!
        : random.int(config.mintime!, config.maxtime!)
      await session.onebot.setGroupBan(session.guildId!, session.userId!, bantime)

      if (config.enableBanMessage) {
        const message = config.banMessage?.replace("{time}", bantime.toString())
        session.send(message || `你已被禁言 ${bantime} 秒！`)
      }
    })

  // 指令 mutehim
  if (config.mutehimEnable) {
    ctx.command("mutehim", "禁言自己或群里的随机成员")
      .action(async ({ session }) => {
        const groupId = session.guildId!
        const isSelf = random.bool(config.mutehimProbability!)

        let targetId = session.userId!
        let targetName = session.event.user.name

        if (!isSelf) {
          // 获取群成员列表并随机选择一个目标
          const members = await session.onebot.getGroupMemberList(groupId)
          const targetMember = members[random.int(0, members.length)]
          targetId = targetMember.user_id.toString()
          targetName = targetMember.nickname || targetMember.card || targetMember.user_id.toString()
        }

        // 禁言时间
        let bantime = config.type === "固定时间"
          ? config.time!
          : random.int(config.mintime!, config.maxtime!)

        // 执行禁言
        await session.onebot.setGroupBan(groupId, targetId, bantime)

        // 发送禁言提示
        const message = config.mutehimBanMessage?.replace("{name}", targetName).replace("{time}", bantime.toString())
        session.send(message || `${targetName} 被禁言 ${bantime} 秒！`)
      })
  }
}