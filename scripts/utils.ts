import fs from 'fs';
import path from 'path';

export async function saveContract(network: string, contract: string, address: string) {
    const addresses = await getContracts();
    addresses[network] = addresses[network] || {};
    addresses[network][contract] = address;
    fs.writeFileSync(path.join(__dirname, '../data/contract-addresses.json'),
                                JSON.stringify(addresses, null, "    "));
}

export function getContracts(): any {
    let json;
    try {
        json = fs.readFileSync(path.join(__dirname,'../data/contract-addresses.json'), 'utf-8');
    } catch {
        json = '{}';
    }   
    return JSON.parse(json);
}

export function sleep(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}