const { GrpcReflection } = require('grpc-js-reflection-client');
const grpc =  require('@grpc/grpc-js');
const fs = require('fs');

const rootCert = fs.readFileSync('/tmp/ssl/ca/ca.key.pem');
const channelCreds = grpc.credentials.createSsl(rootCert);

try {
    (async()=> {
        const client = new GrpcReflection(
            'gateway.grpc.int.ea.com:443',
            grpc.credentials.createInsecure(),
            'v1'
        );
        console.log(await client.listServices());
    })();
}catch(e){
    console.log(e)
}
