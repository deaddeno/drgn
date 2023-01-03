import { parse } from 'https://deno.land/std@v0.170.0/flags/mod.ts'
import { bold, gray, underline, white } from 'https://deno.land/std@v0.170.0/fmt/colors.ts'
import type { Command } from './Command.ts'
import type { Option } from './Option.ts'
import type { ParsedArgs } from './ParsedArgs.d.ts'

export class drgn {
  private commands
  private options
  private _version: string | undefined
  private _name: string | undefined

  constructor() {
    this.commands = new Map<string, Command>()
    this.options = new Map<string, Option>()
    this._version = undefined

    this.run = this.run.bind(this)
  }

  name(n: string) {
    this._name = n

    return this
  }

  command(c: Command) {
    this.commands.set(c.name, c)

    if (c.alias)
      this.commands.set(c.alias, c)

    return this
  }

  option(o: Option) {
    this.options.set(o.name, o)

    if (o.alias)
      this.options.set(o.alias, o)

    return this
  }

  version(v: string) {
    this._version = v

    return this
  }

  async handle(args: ParsedArgs) {
    const help = () => {
      let text = `${bold(this._name ?? '')} ${this._version}`

      text += `\n\n\n${underline(white('USAGE'))}\n\n`
      text += `${white('devyl')} [COMMAND/OPTION] \n`

      text += `\n\n${underline(white('OPTIONS'))}\n\n`

      text += `${white('--help, -h')} | Print this menu.\n`
      text += `${white('--version, -v')} | Print the current version.\n`

      for (const option of this.options.values())
        text += `${white(`--${option.name}`)} | ${option.description}\n`

      if (this.commands.size > 0) {
        text += `\n\n${underline(white('COMMANDS'))}\n\n`

        for (const command of this.commands.values())
          text += `${white(command.name)} | ${command.description}\n`
      }

      console.log(gray(text))
    }

    if (args._.length > 0 && typeof args._[0] === 'string') { // command
      const command = this.commands.get(args._[0])

      if (command)
        await command.action(args)
    } else { // option
      if ((args.version || args.v) && this._version) { // --version, -v option
        console.log(gray(`${bold(this._name ?? '')} ${this._version}`))
      } else if (args.help || args.h) { // --help, -v option
        help()
      } else { // custom option
        const option = this.options.get(Object.keys(args).filter(key => key !== '_')[0])

        if (option)
          await option.action(args)
        else
          help()
      }
    }
  }

  async run(onStart?: (args: ParsedArgs) => Promise<void> | void) {
    const args = parse(Deno.args)

    if (onStart)
      await onStart(args)

    await this.handle(args)
  }
}