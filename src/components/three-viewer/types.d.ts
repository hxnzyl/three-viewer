export type DeepRequired<T> = T extends object
	? {
			[P in keyof T]-?: DeepRequired<T[P]>
	  } & {}
	: T

export type AnyObject<V = any, K = any> = {
	[key in K]: V
}

export type StringObject<K = any> = AnyObject<string, K>

export type NumberObject<K = any> = AnyObject<number, K>

export type BooleanObject<K = any> = AnyObject<boolean, K>

export type DataAnyObject<K = any> = AnyObject<{ data: any }, K>

export type MethodNames<T> = {
	[K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]
