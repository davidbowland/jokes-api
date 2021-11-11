import * as tsConfigPaths from 'tsconfig-paths'
import { readFileSync } from 'fs'

/* Pulumi overwrites some Typescript configuration, so we need to set it back */

const tsConfigPath = 'tsconfig.json'

interface TsConfig {
  compilerOptions: {
    baseUrl: string
    paths: { [key: string]: string[] }
  }
}

const getJsonContents = (filename: string): string => readFileSync(filename, { encoding: 'utf8' })

const removeBlockComments = (input: string): string => input.replace(/\/\*.*?\*\//g, '')

const removeLineComments = (input: string): string => input.replace(/^\s*\/\/.*$/gm, '')

const applyTsConfig = (tsConfig: TsConfig): unknown =>
  tsConfigPaths.register({
    baseUrl: tsConfig.compilerOptions.baseUrl,
    paths: tsConfig.compilerOptions.paths,
  })

// Pipe the config path thru the functions to read and apply tsconfig.json paths
;[tsConfigPath, getJsonContents, removeBlockComments, removeLineComments, JSON.parse, applyTsConfig].reduce(
  (result: unknown, func: any) => func(result)
)
