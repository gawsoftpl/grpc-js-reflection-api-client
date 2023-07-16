import {ClientMethodDefinition} from "@grpc/grpc-js/build/src/make-client";

export type ListMethodsType = {
    name: string
    definition: ClientMethodDefinition<any, any>
}