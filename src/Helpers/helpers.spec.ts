import * as grpc from "@grpc/grpc-js";
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';

jest.mock('./packageObjectHelper', () => {
    const originalModule = jest.requireActual('./packageObjectHelper');
    originalModule.packageObjectHelper = jest.fn().mockImplementation((options: DescriptorServiceHelperOptions) => {
        const packageDefinition = loadSync(join(__dirname, `../../tests/protos/${options['proto_filename']}`), options.protoLoaderOptions);
        return grpc.loadPackageDefinition(packageDefinition);
    });

    return {
        __esModule: true,
        ...originalModule,
    };

})

import { serviceHelper} from "./serviceHelper";
import {DescriptorServiceHelperOptions} from "./packageObjectHelper";

describe("Test Helpers", () => {

    it('Should return grpc service for addressbook', (done) => {
        serviceHelper({
            host: "localhost:545f4",
            servicePath: "addressbook.AddressesService",
            credentials: grpc.ChannelCredentials.createInsecure(),
            proto_filename: 'addressbook.proto',
            protoLoaderOptions: {
                keepCase: true
            }
        }).then(d => {
            expect(d['Add']).toBeDefined()
            done()
        })
    })

    it('Should return grpc service for helloworld', (done) => {
        serviceHelper({
            host: "localhost:545f4",
            servicePath: "helloworld.Greeter",
            credentials: grpc.ChannelCredentials.createInsecure(),
            proto_filename: 'helloworld.proto',
            protoLoaderOptions: {
                keepCase: true
            }
        }).then(proto => {
            expect(proto['SayHello']).toBeDefined()
            done()
        })
    })

    it('Should raise exception on wrong servicePath', (done) => {
        serviceHelper({
            host: "localhost:545f4",
            servicePath: "addressbook.WrongServiceName",
            credentials: grpc.ChannelCredentials.createInsecure(),
            proto_filename: 'addressbook.proto',
            protoLoaderOptions: {
                keepCase: true
            }
        }).catch(e => {
            expect(e.message).toContain('Wrong servicePath');
            done()
        })
    })

    it('Should raise exception on wrong servicePath #2', (done) => {
        serviceHelper({
            host: "localhost:545f4",
            servicePath: "addressbook.AddressesService.WrongServicename",
            credentials: grpc.ChannelCredentials.createInsecure(),
            proto_filename: 'addressbook.proto',
            protoLoaderOptions: {
                keepCase: true
            }
        }).catch(e => {
            expect(e.message).toContain('Wrong servicePath addressbook.AddressesService.WrongServicename');
            done()
        })
    })
})