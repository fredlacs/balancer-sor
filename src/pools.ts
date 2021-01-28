import fetch from 'isomorphic-fetch';
import { SubGraphPools, Pools, Pool, Token } from './types';
import * as bmath from './bmath';

export class POOLS {
    async getAllPublicSwapPools(URL: string): Promise<SubGraphPools> {
        // const result = await fetch(URL);
        const url =
        'https://graph.offchainlabs.com/subgraphs/name/balancer-labs/balancer-subgraph';
        const query = `{
            pools(
                first: 1000, orderBy: liquidity, orderDirection: desc,
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
                    denormWeight
                    decimals
                    balance
                }
                tokensList
                totalSwapVolume
                swapFee
                totalWeight
                publicSwap
                swaps (
                    first: 1, orderBy: timestamp, orderDirection: desc
                ) {
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
        const allPools = await result.json();
        console.log("allPools", allPools)
        return allPools.data;
    }

    async formatPoolsBigNumber(pools: SubGraphPools): Promise<Pools> {
        let onChainPools: Pools = { pools: [] };
        console.log("0", pools)
        for (let i = 0; i < pools.pools.length; i++) {
            let tokens: Token[] = [];
            
            console.log("1")
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
            console.log("2", p)
            pools.pools[i].tokens.forEach(token => {
                let decimals = Number(token.decimals);
                console.log("3")

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
        console.log("4")
        return onChainPools;
    }
}
