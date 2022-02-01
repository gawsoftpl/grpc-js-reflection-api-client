//import { GrpcReflection } from 'grpc-js-reflection-client';
import { GrpcReflection } from '../src/GrpcReflection';

import * as grpc from '@grpc/grpc-js';

/**
 * List services
 */
try {
    (async () => {
        const c = new GrpcReflection('0.0.0.0:3000', grpc.credentials.createInsecure());
        console.log(await c.listServices());
    })();

}catch(e){
    console.log(e);
}
