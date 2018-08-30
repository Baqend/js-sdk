interface TypeSpecification {
  names: string[]
}

interface Meta {
  filename: string
  lineno: number
  columno: number
  path: string
  code: object
}

interface Param {
  name: string
  type?: TypeSpecification
  optional?: boolean
  description?: string
  variable?: boolean
}

interface Definition {
  kind: string
  name: string
  comment: string
  meta: Meta

  longname?: string
  memberof?: string
  scope?: string
  description?: string
  classdesc?: string
  undocumented?: boolean
  deprecated?: boolean
  ignore?: boolean
  type?: TypeSpecification
  params?: Param[]
  inherited?: boolean
  isEnum?: boolean
  access?: string
  readonly?: boolean
  nullable?: boolean
  returns?: Definition[]
  properties?: Definition[]
  defaultvalue?: string
  augments?: string[]
  implements?: string[]
}

interface Namespace {
  prefix: string
  namespaces: { [key: string]: Namespace }
  body: string[]
  name: string
  longname: string
}

interface ParamType {
  name: string
  type: string[]
  optional: boolean
}

type ObjectTypeSpecification = Dictionary<ParamType>

interface Dictionary<T> {
  [key: string]: T
}

interface Taffy {
  TAFFY: true
  insert: Function
  sort: Function
  settings: Function
  store: Function
  (query: { kind?: string | string[], isEnum?: boolean, memberof?: string, longname?: string }): { get(): Definition[] }
}
