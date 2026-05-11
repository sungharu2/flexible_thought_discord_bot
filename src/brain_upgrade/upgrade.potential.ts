import crypto from 'crypto';

// 레어 테이블
const potentialListRareFirst = [
    'STR +12',
    'DEX +12',
    'INT +12',
    'LUK +12',
    'STR +4%',
    'DEX +4%',
    'INT +4%',
    'LUK +4%',
];
const potentialListRareSecond = [
    'STR +12',
    'DEX +12',
    'INT +12',
    'LUK +12',
    'STR +4%',
    'DEX +4%',
    'INT +4%',
    'LUK +4%',
    'STR +6',
    'DEX +6',
    'INT +6',
    'LUK +6',
];
const potentialListRareThird = [
    'STR +12',
    'DEX +12',
    'INT +12',
    'LUK +12',
    'STR +4%',
    'DEX +4%',
    'INT +4%',
    'LUK +4%',
    'STR +6',
    'DEX +6',
    'INT +6',
    'LUK +6',
];
// 에픽 테이블
const potentialListEpicFirst = [
    'STR +18',
    'DEX +18',
    'INT +18',
    'LUK +18',
    'STR +7%',
    'DEX +7%',
    'INT +7%',
    'LUK +7%',
];
const potentialListEpicSecond = [
    'STR +12',
    'DEX +12',
    'INT +12',
    'LUK +12',
    'STR +4%',
    'DEX +4%',
    'INT +4%',
    'LUK +4%',
    'STR +18',
    'DEX +18',
    'INT +18',
    'LUK +18',
    'STR +7%',
    'DEX +7%',
    'INT +7%',
    'LUK +7%',
];
const potentialListEpicThird = [
    'STR +12',
    'DEX +12',
    'INT +12',
    'LUK +12',
    'STR +4%',
    'DEX +4%',
    'INT +4%',
    'LUK +4%',
    'STR +18',
    'DEX +18',
    'INT +18',
    'LUK +18',
    'STR +7%',
    'DEX +7%',
    'INT +7%',
    'LUK +7%',
];
// 유니크 테이블
const potentialListUniqueFirst = [
    'STR +24',
    'DEX +24',
    'INT +24',
    'LUK +24',
    'STR +10%',
    'DEX +10%',
    'INT +10%',
    'LUK +10%',
];
const potentialListUniqueSecond = [
    'STR +18',
    'DEX +18',
    'INT +18',
    'LUK +18',
    'STR +7%',
    'DEX +7%',
    'INT +7%',
    'LUK +7%',
    'STR +24',
    'DEX +24',
    'INT +24',
    'LUK +24',
    'STR +10%',
    'DEX +10%',
    'INT +10%',
    'LUK +10%',
];
const potentialListUniqueThird = [
    'STR +18',
    'DEX +18',
    'INT +18',
    'LUK +18',
    'STR +7%',
    'DEX +7%',
    'INT +7%',
    'LUK +7%',
    'STR +24',
    'DEX +24',
    'INT +24',
    'LUK +24',
    'STR +10%',
    'DEX +10%',
    'INT +10%',
    'LUK +10%',
];
// 레전드리 테이블
const potentialListLegendaryFirst = [
    'STR +32',
    'DEX +32',
    'INT +32',
    'LUK +32',
    'STR +13%',
    'DEX +13%',
    'INT +13%',
    'LUK +13%',
];
const potentialListLegendarySecond = [
    'STR +24',
    'DEX +24',
    'INT +24',
    'LUK +24',
    'STR +10%',
    'DEX +10%',
    'INT +10%',
    'LUK +10%',
    'STR +32',
    'DEX +32',
    'INT +32',
    'LUK +32',
    'STR +13%',
    'DEX +13%',
    'INT +13%',
    'LUK +13%',
];
const potentialListLegendaryThird = [
    'STR +24',
    'DEX +24',
    'INT +24',
    'LUK +24',
    'STR +10%',
    'DEX +10%',
    'INT +10%',
    'LUK +10%',
    'STR +32',
    'DEX +32',
    'INT +32',
    'LUK +32',
    'STR +13%',
    'DEX +13%',
    'INT +13%',
    'LUK +13%',
];

// 등급업 확률
const potentialPromotionChance = [
    0.06,
    0.018,
    0.003
]

export function initBrainPotential(): string {
    const firstOptionIndex = generateRandomNumber(potentialListRareFirst.length);
    const secondOptionIndex = generateRandomNumber(potentialListRareSecond.length);
    const thirdOptionIndex = generateRandomNumber(potentialListRareThird.length);


    const potential = '1_' + firstOptionIndex + '_' + secondOptionIndex + '_' + thirdOptionIndex;
    return potential
}

export function rerollPotential(potential: string): string {
    const potentialGrade = potential.split('_')[0];
    if (potentialGrade == '0' || potentialGrade == '1') {
        if (tryPromotion(potentialGrade)) {
            const newPromotedPotential = '2_0_0_0';
            return rerollPotential(newPromotedPotential);
        }
        const firstOptionIndex = generateRandomNumber(potentialListRareFirst.length);
        const secondOptionIndex = generateRandomNumber(potentialListRareSecond.length);
        const thirdOptionIndex = generateRandomNumber(potentialListRareThird.length);
        
        const newPotential = '1_' + firstOptionIndex + '_' + secondOptionIndex + '_' + thirdOptionIndex;
        return newPotential
    }
    if (potentialGrade == '2') {
        if (tryPromotion(potentialGrade)) {
            const newPromotedPotential = '3_0_0_0';
            return rerollPotential(newPromotedPotential);
        }
        
        const firstOptionIndex = generateRandomNumber(potentialListEpicFirst.length);
        const secondOptionIndex = generateRandomNumber(potentialListEpicSecond.length);
        const thirdOptionIndex = generateRandomNumber(potentialListEpicThird.length);
        
        const newPotential = '2_' + firstOptionIndex + '_' + secondOptionIndex + '_' + thirdOptionIndex;
        return newPotential
    }
    if (potentialGrade == '3') {
        if (tryPromotion(potentialGrade)) {
            const newPromotedPotential = '4_0_0_0';
            return rerollPotential(newPromotedPotential);
        }
        
        const firstOptionIndex = generateRandomNumber(potentialListUniqueFirst.length);
        const secondOptionIndex = generateRandomNumber(potentialListUniqueSecond.length);
        const thirdOptionIndex = generateRandomNumber(potentialListUniqueThird.length);
        
        const newPotential = '3_' + firstOptionIndex + '_' + secondOptionIndex + '_' + thirdOptionIndex;
        return newPotential
    }
    if (potentialGrade == '4') {
        // 레전드리 다음 등급 출시까지 주석
        // if (tryPromotion(potentialGrade)) {
        //     const newPromotedPotential = '2_0_0_0';
        //     return rerollPotential(newPromotedPotential);
        // }
        
        const firstOptionIndex = generateRandomNumber(potentialListLegendaryFirst.length);
        const secondOptionIndex = generateRandomNumber(potentialListLegendarySecond.length);
        const thirdOptionIndex = generateRandomNumber(potentialListLegendaryThird.length);
        
        const newPotential = '4_' + firstOptionIndex + '_' + secondOptionIndex + '_' + thirdOptionIndex;
        return newPotential
    }
    return '0_0_0_0';
}

export function printPotential(potential: string): string {
    try {
        const potentialGrade = potential.split('_')[0];
        const potentialFirst = Number.parseInt(potential.split('_')[1]);
        const potentialSecond = Number.parseInt(potential.split('_')[2]);
        const potentialThird = Number.parseInt(potential.split('_')[3]);

        // console.log(potential);
        // console.log(potentialGrade);
        // console.log(potentialFirst);
        // console.log(potentialSecond);
        // console.log(potentialThird);
    
        if (potentialGrade == '0') {
            return '잠재능력 미설정';
        }
        if (potentialGrade == '1') {
            return '**레어**\n' 
                + potentialListRareFirst[potentialFirst] + '\n' 
                + potentialListRareSecond[potentialSecond] + '\n'  
                + potentialListRareThird[potentialThird];
        }
        if (potentialGrade == '2') {
            return '**에픽**\n' 
                + potentialListEpicFirst[potentialFirst] + '\n' 
                + potentialListEpicSecond[potentialSecond] + '\n'  
                + potentialListEpicThird[potentialThird];
        }
        if (potentialGrade == '3') {
            return '**☆ 유니크 ☆**\n' 
                + potentialListUniqueFirst[potentialFirst] + '\n' 
                + potentialListUniqueSecond[potentialSecond] + '\n'  
                + potentialListUniqueThird[potentialThird];
        }
        if (potentialGrade == '4') {
            return '**★★ 레전드리 ★★**\n' 
                + potentialListLegendaryFirst[potentialFirst] + '\n' 
                + potentialListLegendarySecond[potentialSecond] + '\n'  
                + potentialListLegendaryThird[potentialThird];
        }
    }
    catch (err) {
        console.error(err);
        return '잘못된 잠재능력';
    }
    return '잘못된 잠재능력'
}

type PotentialData = {
    addStat: number,
    multStat: number
}
export function getPotentialData(potential: string): PotentialData {
    const splitedPotential = potential.split('_');
    //console.log('splitedPotential: ' + splitedPotential);
    const potentialGrade = splitedPotential[0];
    const potentialFirst = Number.parseInt(splitedPotential[1]);
    const potentialSecond = Number.parseInt(splitedPotential[2]);
    const potentialThird = Number.parseInt(splitedPotential[3]);
    let addStat = 0;
    let multStat = 0;

    if (potentialGrade == '1') {
        addStat += potentialListRareFirst[potentialFirst].includes('INT') && !potentialListRareFirst[potentialFirst].includes('%') ?
            Number.parseInt(potentialListRareFirst[potentialFirst].replace('INT +', '')) : 0;
        addStat += potentialListRareSecond[potentialSecond].includes('INT') && !potentialListRareSecond[potentialSecond].includes('%') ?
            Number.parseInt(potentialListRareSecond[potentialSecond].replace('INT +', '')) : 0;
        addStat += potentialListRareThird[potentialThird].includes('INT') && !potentialListRareThird[potentialThird].includes('%') ?
            Number.parseInt(potentialListRareThird[potentialThird].replace('INT +', '')) : 0;
        multStat += potentialListRareFirst[potentialFirst].includes('INT') && potentialListRareFirst[potentialFirst].includes('%') ?
            Number.parseInt(potentialListRareFirst[potentialFirst].replace('INT +', '').replace('%', '')) : 0;
        multStat += potentialListRareSecond[potentialSecond].includes('INT') && potentialListRareSecond[potentialSecond].includes('%') ?
            Number.parseInt(potentialListRareSecond[potentialSecond].replace('INT +', '').replace('%', '')) : 0;
        multStat += potentialListRareThird[potentialThird].includes('INT') && potentialListRareThird[potentialThird].includes('%') ?
            Number.parseInt(potentialListRareThird[potentialThird].replace('INT +', '').replace('%', '')) : 0;
    }
    if (potentialGrade == '2') {
        addStat += potentialListEpicFirst[potentialFirst].includes('INT') && !potentialListEpicFirst[potentialFirst].includes('%') ?
            Number.parseInt(potentialListEpicFirst[potentialFirst].replace('INT +', '')) : 0;
        addStat += potentialListEpicSecond[potentialSecond].includes('INT') && !potentialListEpicSecond[potentialSecond].includes('%') ?
            Number.parseInt(potentialListEpicSecond[potentialSecond].replace('INT +', '')) : 0;
        addStat += potentialListEpicThird[potentialThird].includes('INT') && !potentialListEpicThird[potentialThird].includes('%') ?
            Number.parseInt(potentialListEpicThird[potentialThird].replace('INT +', '')) : 0;
        multStat += potentialListEpicFirst[potentialFirst].includes('INT') && potentialListEpicFirst[potentialFirst].includes('%') ?
            Number.parseInt(potentialListEpicFirst[potentialFirst].replace('INT +', '').replace('%', '')) : 0;
        multStat += potentialListEpicSecond[potentialSecond].includes('INT') && potentialListEpicSecond[potentialSecond].includes('%') ?
            Number.parseInt(potentialListEpicSecond[potentialSecond].replace('INT +', '').replace('%', '')) : 0;
        multStat += potentialListEpicThird[potentialThird].includes('INT') && potentialListEpicThird[potentialThird].includes('%') ?
            Number.parseInt(potentialListEpicThird[potentialThird].replace('INT +', '').replace('%', '')) : 0;
    }    
    if (potentialGrade == '3') {
        addStat += potentialListUniqueFirst[potentialFirst].includes('INT') && !potentialListUniqueFirst[potentialFirst].includes('%') ?
            Number.parseInt(potentialListUniqueFirst[potentialFirst].replace('INT +', '')) : 0;
        addStat += potentialListUniqueSecond[potentialSecond].includes('INT') && !potentialListUniqueSecond[potentialSecond].includes('%') ?
            Number.parseInt(potentialListUniqueSecond[potentialSecond].replace('INT +', '')) : 0;
        addStat += potentialListUniqueThird[potentialThird].includes('INT') && !potentialListUniqueThird[potentialThird].includes('%') ?
            Number.parseInt(potentialListUniqueThird[potentialThird].replace('INT +', '')) : 0;
        multStat += potentialListUniqueFirst[potentialFirst].includes('INT') && potentialListUniqueFirst[potentialFirst].includes('%') ?
            Number.parseInt(potentialListUniqueFirst[potentialFirst].replace('INT +', '').replace('%', '')) : 0;
        multStat += potentialListUniqueSecond[potentialSecond].includes('INT') && potentialListUniqueSecond[potentialSecond].includes('%') ?
            Number.parseInt(potentialListUniqueSecond[potentialSecond].replace('INT +', '').replace('%', '')) : 0;
        multStat += potentialListUniqueThird[potentialThird].includes('INT') && potentialListUniqueThird[potentialThird].includes('%') ?
            Number.parseInt(potentialListUniqueThird[potentialThird].replace('INT +', '').replace('%', '')) : 0;
    }    
    if (potentialGrade == '4') {
        addStat += potentialListLegendaryFirst[potentialFirst].includes('INT') && !potentialListLegendaryFirst[potentialFirst].includes('%') ?
            Number.parseInt(potentialListLegendaryFirst[potentialFirst].replace('INT +', '')) : 0;
        addStat += potentialListLegendarySecond[potentialSecond].includes('INT') && !potentialListLegendarySecond[potentialSecond].includes('%') ?
            Number.parseInt(potentialListLegendarySecond[potentialSecond].replace('INT +', '')) : 0;
        addStat += potentialListLegendaryThird[potentialThird].includes('INT') && !potentialListLegendaryThird[potentialThird].includes('%') ?
            Number.parseInt(potentialListLegendaryThird[potentialThird].replace('INT +', '')) : 0;
        multStat += potentialListLegendaryFirst[potentialFirst].includes('INT') && potentialListLegendaryFirst[potentialFirst].includes('%') ?
            Number.parseInt(potentialListLegendaryFirst[potentialFirst].replace('INT +', '').replace('%', '')) : 0;
        multStat += potentialListLegendarySecond[potentialSecond].includes('INT') && potentialListLegendarySecond[potentialSecond].includes('%') ?
            Number.parseInt(potentialListLegendarySecond[potentialSecond].replace('INT +', '').replace('%', '')) : 0;
        multStat += potentialListLegendaryThird[potentialThird].includes('INT') && potentialListLegendaryThird[potentialThird].includes('%') ?
            Number.parseInt(potentialListLegendaryThird[potentialThird].replace('INT +', '').replace('%', '')) : 0;
    }
    return {
        addStat: addStat,
        multStat: multStat
    };
}


function generateRandomNumber(max: number) {
    return crypto.randomInt(0, max);
}

function tryPromotion(potentialGrade: string): boolean {
    let promotionChance = 0;
    if (potentialGrade == '1') promotionChance = potentialPromotionChance[0];
    if (potentialGrade == '2') promotionChance = potentialPromotionChance[1];
    if (potentialGrade == '3') promotionChance = potentialPromotionChance[2];
    if (potentialGrade == '4') promotionChance = potentialPromotionChance[3];

    const rand = generateRandomNumber(1000);
    console.log('rand: ' + rand);
    console.log('promotionChance * 1000: ' + promotionChance * 1000);
    if (rand < promotionChance * 1000) {
        return true;    
    } else {
        return false;
    }
}
  