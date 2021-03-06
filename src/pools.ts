import fetch from 'isomorphic-fetch';
import { SubGraphPools, Pools, Pool, Token } from './types';
import * as bmath from './bmath';

export class POOLS {
    async getAllPublicSwapPools(URL: string): Promise<SubGraphPools> {
        const url =
            'https://graph.offchainlabs.com/subgraphs/name/balancer-labs/balancer-subgraph';
        const query = `{
            pools(first: 1000, orderBy: liquidity, orderDirection: desc,
                    where: {
                    publicSwap: true,
                    active: true,
                    tokensCount_gt: 1
                }) {
                id
                finalized
                crp
                tokens {
                address
                symbol
                name
                }
                tokensList
                totalSwapVolume
                swaps(first: 1, orderBy: timestamp, orderDirection: desc) {
                poolTotalSwapVolume
                }
            }
        }`;

        const result = await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });
        // const result = await fetch(URL);
        const allPools = result.json();
        return allPools;
    }

    async formatPoolsBigNumber(pools: SubGraphPools): Promise<Pools> {
        let onChainPools: Pools = { pools: [] };

        for (let i = 0; i < pools.pools.length; i++) {
            let tokens: Token[] = [];

            let p: Pool = {
                id: pools.pools[i].id,
                swapFee: bmath.scale(bmath.bnum(pools.pools[i].swapFee), 18),
                totalWeight: bmath.scale(
                    bmath.bnum(pools.pools[i].totalWeight),
                    18
                ),
                tokens: tokens,
                tokensList: pools.pools[i].tokensList,
            };

            pools.pools[i].tokens.forEach(token => {
                let decimals = Number(token.decimals);

                p.tokens.push({
                    address: token.address,
                    balance: bmath.scale(bmath.bnum(token.balance), decimals),
                    decimals: decimals,
                    denormWeight: bmath.scale(
                        bmath.bnum(token.denormWeight),
                        18
                    ),
                });
            });
            onChainPools.pools.push(p);
        }

        return onChainPools;
    }
}
