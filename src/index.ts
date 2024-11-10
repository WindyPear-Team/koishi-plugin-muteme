import { Context, Schema, Random} from 'koishi'
import {} from 'koishi-plugin-adapter-onebot'
export const name = 'muteme'

export interface Config {
  type: "随机时间"  |  "固定时间"
  time?: number
  maxtime?: number
  mintime?: number
  
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
])

export function apply(ctx: Context, config: Config) {
  ctx.command("muteme","让机器人禁言你")
  .action(({ session }) => {
    const random = new Random(() => Math.random())
    if(config.type=="固定时间"){
      session.onebot.setGroupBan(session.event.guild.id,session.event.user.id,config.time)
    }else{
      const bantime = random.int(config.mintime, config.maxtime)
      session.onebot.setGroupBan(session.event.guild.id,session.event.user.id,bantime)
    }
  })
}