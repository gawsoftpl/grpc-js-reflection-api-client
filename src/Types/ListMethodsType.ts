import {MethodDefinition} from "@grpc/grpc-js/build/src/make-client";

export type ListMethodsType = {
    name: string
    definition: MethodDefinition<any, any>
}