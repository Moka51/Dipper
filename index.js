/*
MIT License

Copyright (c) 2021 Zyx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const { Telegraf } = require('telegraf')
const fs = require('fs');

// web3 
const Web3 = require('web3');
const web3 = new Web3("https://bsc-dataseed.binance.org/"); // connect to the data seed

// config
const config = require('./config.json'); // configuration file
const bot = new Telegraf(config.telegram_token) // start telegram bot
const botId = config.telegram_token.split(':')[0]; // the content before the token is our bot it, so just splice it.
const pancakeSwapContract = config.tokens.pancakeRouter; // pancakeRouter
const BNBTokenAddress = config.tokens.BNBToken //BNB
const USDTokenAddress  = config.tokens.USDTtoken //USDT

// delay commands

var commandsDelay = []; // as we are hardcoded, the delay is globally based as we're supposed to be in just one server. 
var commandDelayTime = config.command.command_delayTime*1000; // this is delay to a command to be re-executed.
var command_deleteTime = config.command.command_deleteTime*1000; // delay to delete messages 

// bn
const BigNumber = require('bignumber.js'); // bn from web3 doesnt work with decimals, so we're going to use ethers one.
BigNumber.set({ DECIMAL_PLACES: 18 }); // setting the max decimals to 18

// web3 abis

//tokenAbi is based on MSC contract - 0x9c9ac8b098a7d47ed1834599ce2dc29cb94103e9
let pancakeSwapAbi =  [{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
let tokenAbi = [{"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"},{"internalType":"uint256","name":"_decimals","type":"uint256"},{"internalType":"uint256","name":"_supply","type":"uint256"},{"internalType":"uint256","name":"_txFee","type":"uint256"},{"internalType":"uint256","name":"_burnFee","type":"uint256"},{"internalType":"uint256","name":"_charityFee","type":"uint256"},{"internalType":"address","name":"_FeeAddress","type":"address"},{"internalType":"address","name":"tokenOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"FeeAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_BURN_FEE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_CHARITY_FEE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_TAX_FEE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tAmount","type":"uint256"}],"name":"deliver","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"excludeAccount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"includeAccount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isCharity","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isExcluded","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tAmount","type":"uint256"},{"internalType":"bool","name":"deductTransferFee","type":"bool"}],"name":"reflectionFromToken","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"setAsCharityAccount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"rAmount","type":"uint256"}],"name":"tokenFromReflection","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalBurn","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalCharity","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalFees","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_txFee","type":"uint256"},{"internalType":"uint256","name":"_burnFee","type":"uint256"},{"internalType":"uint256","name":"_charityFee","type":"uint256"}],"name":"updateFee","outputs":[],"stateMutability":"nonpayable","type":"function"}];

/***********
***events***
************/ 

// new users
bot.on('new_chat_members', (ctx) => {
    delMessage(ctx); // delete messages by ctx
    let message = ctx.message.new_chat_members; // message content 
    if(!config.messages.welcome.enabled) return; // check if welcome message is enabled
    if(message[0].username) ctx.replyWithMarkdown((`@${message[0].username}, ${config.messages.welcome.group} ${ctx.chat.title}. ${config.messages.welcome.content}`).replace('_', ''))
    else ctx.replyWithMarkdown((`[@${message[0].first_name}](tg://user?id=${message[0].id}), ${config.messages.welcome.group} ${ctx.chat.title}. ${config.messages.welcome.content}`).replace('_', ''))    
})

// left user
bot.on('left_chat_member', (ctx) => {
    delMessage(ctx);
})

/*************
***commands***
**************/ 

// ping command to check if command is running
bot.command('ping', (ctx) => {
    delMessage(ctx);
    let command = 'ping'
    if(checkIncludes(command)) return;
    pushToArray(command); 
    removeFromArray(command, commandDelayTime); 
    ctx.reply(config.messages.running).then((e) => {
        setTimeout(() => delMessage(ctx, e.message_id), command_deleteTime)
    })
});

// command to getChatId
bot.command('chatId', (ctx) => {
    delMessage(ctx);
    let command = 'chatId'
    if(checkIncludes(command)) return;
    pushToArray(command); 
    removeFromArray(command, commandDelayTime); 
    ctx.reply(ctx.chat.id).then((e) => {
        setTimeout(() => delMessage(ctx, e.message_id), command_deleteTime)
    });
});

// send contract number to chat
bot.command('contract', (ctx) => {
    delMessage(ctx);
    let command = 'contract'
    if(checkIncludes(command)) return;
    pushToArray(command)
    removeFromArray(command, commandDelayTime);
    ctx.reply(config.messages.contract).then((cN) => {
        setTimeout(() => delMessage(ctx, cN.message_id), command_deleteTime)
        ctx.reply(config.tokens.mainToken.token).then((e) => {
            setTimeout(() => delMessage(ctx, e.message_id), command_deleteTime)
        })
    })
    
});

// where to buy command
bot.command('buy', (ctx) => {
    delMessage(ctx); 
    let command = 'buy'
    if(checkIncludes(command)) return
    pushToArray(command) 
    removeFromArray(command, commandDelayTime); 
    ctx.reply(`
    https://dex.poolpartyfinance.io/#/swap?outputCurrency=${config.tokens.mainToken.token}
    ---- buy from poolparty

    https://poocoin.app/tokens/0x9c9ac8b098a7d47ed1834599ce2dc29cb94103e9=${config.tokens.mainToken.token}
    ---- buy from poocoin
    
    https://exchange.pancakeswap.finance/#/swap?outputCurrency=${config.tokens.mainToken.token}
    ---- buy from pancake`).then((e) => {
        setTimeout(() => delMessage(ctx, e.message_id), command_deleteTime)
    })
});

bot.command('roadmap', (ctx) => {
    delMessage(ctx); 
    let command = 'road'
    if(checkIncludes(command)) return
    pushToArray(command) 
    removeFromArray(command, commandDelayTime); 

    ctx.replyWithMarkdown(config.messages.roadmap.join('\n')).then((e) => {
        setTimeout(() => delMessage(ctx, e.message_id), command_deleteTime)
    })
})

/**** this is maybe what u looking for ****/
bot.command('supply', async (ctx) => {
    delMessage(ctx); 
    let command = 'supply'
    if(checkIncludes(command)) return
    pushToArray(command) 
    removeFromArray(command, commandDelayTime); 
    
    let regex = new RegExp(/^(0x[a-fA-F0-9]{40,})$/)
    var args = ctx.message.text.split(' ');
    const tokenAddress = (config.tokens.mainToken.allowMultipleTokens) ? ((args[1]) ? args[1] : config.tokens.mainToken.token) : config.tokens.mainToken.token; 

    let isBEP20Token = regex.test(tokenAddress);
    if(!isBEP20Token) return; // safe check

    let supply = await getSupply(tokenAddress);
    let symbol = await getSymbol(tokenAddress);
    let token = (symbol) ? `Supply ${symbol}`: 'Supply' 
    let decimals = (supply.decimals) ? new BigNumber(supply.decimals): new BigNumber(8);
    let minted = (supply.minted) ? (new BigNumber(supply.minted).div(new BigNumber(Math.pow(10, decimals)))): 0
    let burned = (supply.burned) ? (new BigNumber(supply.burned).div(new BigNumber(Math.pow(10, decimals)))): 0
    
    try {
        circulation = (await new BigNumber(minted).minus(new BigNumber(burned))).toFixed(0)
    } catch {
        circulation = 0;
    }
    ctx.replyWithMarkdown(`*${token}*\nMinted: *${numFormat(minted)}*\nBurned: *${numFormat(burned)}*\nCirculation Supply: *${numFormat(circulation)}*`).then((e) => {
        setTimeout(() => delMessage(ctx, e.message_id), command_deleteTime)
    })
})

bot.command('price', async (ctx) => {
    delMessage(ctx); 
    
    let command = 'price';
    if(checkIncludes(command)) return;
    pushToArray(command) 
    removeFromArray(command, commandDelayTime); 

    let regex = new RegExp(/^(0x[a-fA-F0-9]{40,})$/)
    var args = ctx.message.text.split(' ');
    const tokenAddress = (config.tokens.mainToken.allowMultipleTokens) ? ((args[1]) ? args[1] : config.tokens.mainToken.token) : config.tokens.mainToken.token; 

    let isBEP20Token = regex.test(tokenAddress);
    if(!isBEP20Token) return; // safe check

    let bnbPrice = await new BigNumber(await calcBNBPrice());
    let priceInBnb = await new BigNumber(await calcSell(1, tokenAddress));
    let symbol = await getSymbol(tokenAddress);

    if(!bnbPrice || !priceInBnb || !symbol) return;
    priceFix = (priceInBnb.toString().indexOf('e-') > -1) ? Number(priceInBnb.toString().split('.')[1].split('e-')[0].length) + Number(priceInBnb.toString().split('.')[1].split('e-')[1]) : 8
    ctx.replyWithHTML(`[Price <b>${symbol}</b>]: \n\nPrice in BNB: <b>${priceInBnb.toFixed(priceFix).toString()}</b>\nPrice in USD: <b>U$ ${(priceInBnb.times(bnbPrice).toFixed(priceFix).toString())}\n\n</b>BNB Price: <b>U$ ${bnbPrice.toFixed(2)}</b>`)
})

/****** that's it ******/

bot.command('bsc', (ctx) => {
    delMessage(ctx); 
    let command = 'bsc'
    if(checkIncludes(command)) return;
    pushToArray(command) 
    removeFromArray(command, commandDelayTime); 
    ctx.reply(`https://bscscan.com/token/${config.tokens.mainToken.token}`).then((e) => {
        setTimeout(() => delMessage(ctx, e.message_id), command_deleteTime)
    })
});

bot.command('chart', (ctx) => {
    delMessage(ctx); 
    let command = 'chart'
    if(checkIncludes(command)) return delMessage(ctx);
    pushToArray(command) 
    removeFromArray(command, commandDelayTime); 

    ctx.reply(`Chart Link: https://poocoin.app/tokens/${config.tokens.mainToken.token}`).then((e) => {
        setTimeout(() => delMessage(ctx, e.message_id), command_deleteTime)
    })
})

bot.command('link', (ctx) => {
    delMessage(ctx); 
    let command = 'link'
    if(checkIncludes(command)) return;
    pushToArray(command);
    removeFromArray(command, commandDelayTime);

    if(!config.social.discord) return;
    
    ctx.reply(`${config.social.defi}`).then((e) => {
        setTimeout(() => delMessage(ctx, e.message_id), command_deleteTime)
    })
});

bot.command('whitepaper', (ctx) => {
    delMessage(ctx); 
    let command = 'white'
    if(checkIncludes(command)) return
    pushToArray(command) 
    removeFromArray(command, commandDelayTime); 

    if(!config.social.discord) return;
    ctx.reply(`Whitepaper: ${config.social.whitepaper}`).then((e) => {
        setTimeout(() => delMessage(ctx, e.message_id), command_deleteTime)
    })
})


bot.command('discord', (ctx) => {
    delMessage(ctx); 
    let command = 'disc'
    if(checkIncludes(command)) return
    pushToArray(command) 
    removeFromArray(command, commandDelayTime); 

    if(!config.social.discord) return;
    ctx.reply(`Link Discord: ${config.social.discord}`).then((e) => {
        setTimeout(() => delMessage(ctx, e.message_id), command_deleteTime)
    })
})

bot.command('telegram', (ctx) => {
    delMessage(ctx);
    let command = 'telegram'
    if(checkIncludes(command)) return;
    pushToArray(command);
    removeFromArray(command, commandDelayTime);

    if(!config.social.telegram) return;
    ctx.reply(`Link Telegram: ${config.social.telegram}`).then((e) => {
        setTimeout(() => delMessage(ctx, e.message_id), command_deleteTime)
    })
});

// blog link
bot.command('blog', (ctx) => {
    delMessage(ctx);
    let command = 'blog'
    if(checkIncludes(command)) return;
    pushToArray(command);
    removeFromArray(command, commandDelayTime);

    if(!config.social.blog) return;
    ctx.reply(`Blog: ${config.social.blog}`).then((e) => {
        setTimeout(() => delMessage(ctx, e.message_id), command_deleteTime)
    })
})

// command to test the inline menu when chat close!
bot.command('treemap', (ctx) => {
    menuMiddleware.replyToContext(ctx);
})

// inline menu when chat close
const {MenuTemplate, MenuMiddleware, generateSendMenuToChatFunction} = require('telegraf-inline-menu');
let elements = config.messages.nightMode.template 
let objectElements = Object.keys(elements);
const menuTemplate = new MenuTemplate(ctx => config.messages.nightMode.close.headMessage)
for(i = 0; i < objectElements.length; i++) {
    menuTemplate.url(objectElements[i], elements[objectElements[i]].link, {joinLastRow: elements[objectElements[i]].joinLastRow});
}
const menuMiddleware = new MenuMiddleware('/', menuTemplate)
bot.use(menuMiddleware)
const sendMenuFunction = generateSendMenuToChatFunction(bot.telegram, menuTemplate, '/')

bot.launch().then(() => { // when bot launch setup the night mode.
    console.log('Running! Starting time!');
    console.log('Start Time', new Date().getHours())

    if(!config.nightMode.enabled) return console.log('Night mode isnt enabled chat will remain open!'); // check if night mode is enabled!
    console.log(`Night mode is enabled! The chat will close: ${config.nightMode.close} and open: ${config.nightMode.open}`);
    setInterval(async () => {
        horas = new Date().getHours()
        if(horas == config.nightMode.open) {
            let chat = await bot.telegram.getChat(config.channel);
            let chatMuted = chat;
            console.log(`${config.nightMode.open}, opening chat!`);
            let chatAction = (chatMuted.permissions.can_send_messages) ? false : true;
            console.log(chatAction);
            if(chatAction) {
                bot.telegram.setChatPermissions(config.channel, {can_send_messages: true, can_send_media_messages: true}).then((e) => {
                    console.log('Chat Opened!');
                    bot.telegram.sendMessage(config.channel, config.messages.nightMode.open, { parse_mode: "Markdown" })
                }).catch((e) => console.log('Error while opening the chat!', e))
            }
        } else if(horas == config.nightMode.close) {
            console.log(`${config.nightMode.close}, closing chat!`);
            let chat = await bot.telegram.getChat(config.channel);
            let chatMuted = chat;
            let chatAction = (chatMuted.permissions.can_send_messages) ? false : true;
            console.log(chatAction);
            if(!chatAction) {
                bot.telegram.setChatPermissions(config.channel, {can_send_messages: false}).then(() => {
                    console.log('Chat closed!');
                    sendMenuFunction(config.channel, bot.telegram)
                }).catch((e) => console.log('Cant close chat!', e))
            }
        }
    }, 10000)
});


/*********
***web3***
**********/ 

// pricing the coin by getting reserves is better, getamountsout does 0.25% calc tax, but im lazy, so that's how i'm doing it, thanks linch
// https://gist.github.com/Linch1/ede03999f483f2b1d5fcac9e8b312f2c

async function getBalance(tokenAdress) { // this can be used to token value. a balance command will be made.
    let tokenRouter = await new web3.eth.Contract(tokenAbi, tokenAdress);
    balance = await tokenRouter.methods.balanceOf(config.tokens.mainToken.deadAdress).call();
    return balance;
}

async function getSupply(tokenAdress) {
    let tokenRouter = await new web3.eth.Contract(tokenAbi, tokenAdress);
    let decimals = await tokenRouter.methods.decimals().call();
    let minted = await tokenRouter.methods.totalSupply().call();
    let burned = await getBalance(tokenAdress);
    return {minted, burned, decimals};
}

async function getSymbol(tokenAdress) {
    let tokenRouter = await new web3.eth.Contract(tokenAbi, tokenAdress);
    tokenSymbol = await tokenRouter.methods.symbol().call();
    tokenSymbol = (tokenSymbol) ? tokenSymbol: undefined;
    return tokenSymbol;
}

async function calcSell(tokensToSell, tokenAddres){

    let tokenRouter = await new web3.eth.Contract(tokenAbi, tokenAddres);
    let tokenDecimals = await tokenRouter.methods.decimals().call();
    
    tokensToSell = setDecimals(tokensToSell, tokenDecimals);
    let amountOut;
    try {
        let router = await new web3.eth.Contract(pancakeSwapAbi, pancakeSwapContract);
        amountOut = await router.methods.getAmountsOut(tokensToSell, [tokenAddres, BNBTokenAddress]).call();
        amountOut = web3.utils.fromWei(amountOut[1]);
    } catch (error) {}
    
    if(!amountOut) return 0;
    return amountOut;
}

async function calcBNBPrice(){

    let bnbToSell = web3.utils.toWei("1", "ether"); // if this isnt 1, the price will be wrong.
    let amountOut;
    try {
        let router = await new web3.eth.Contract( pancakeSwapAbi, pancakeSwapContract );
        amountOut = await router.methods.getAmountsOut(bnbToSell, [BNBTokenAddress, USDTokenAddress]).call();
        amountOut =  web3.utils.fromWei(amountOut[1]);
    } catch (error) {}
    if(!amountOut) return 0;
    return amountOut;
}

function setDecimals( number, decimals ){
    number = number.toString();
    let numberAbs = number.split('.')[0]
    let numberDecimals = number.split('.')[1] ? number.split('.')[1] : '';
    while( numberDecimals.length < decimals ){
        numberDecimals += "0";
    }
    return numberAbs + numberDecimals;
}

/*********
***utils***
**********/ 

function numFormat(num) {
    num = Number(num).toFixed(0);
    return Intl.NumberFormat().format(num)
}

function timer(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    })
}

function pushToArray(el) {
    return commandsDelay.push(el);
}

function removeFromArray(el, timer) {
    setTimeout(() => {
        commandsDelay.splice(commandsDelay.indexOf(el), 1)
    }, timer)
}

function checkIncludes(el) {
    return commandsDelay.includes(el)
}

async function delMessage(ctx, after) {
    let member = await bot.telegram.getChatMember(ctx.chat.id, botId);
    if(!member.can_delete_messages) return;
    if(!after) {
        await timer(1000);
        return await ctx.deleteMessage(ctx.message.message_id).catch(e => e);
    } else {
        await timer(1000);
        return await ctx.deleteMessage(after).catch(e => e);
    }
    
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))