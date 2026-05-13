import crypto from 'crypto';

const neuronUpgradeSuccessChance = [
    0.95, // 0 -> 1
    0.9,
    0.85,
    0.8,
    0.75,
    0.7,  // 5 -> 6
    0.65,
    0.6,
    0.55,
    0.5,
    0.45, // 10 -> 11
    0.4,
    0.35,
    0.3,
    0.3,
    0.3,  // 15 -> 16
    0.3,
    0.15,
    0.15,
    0.15,
    0.3, // 20 -> 21
    0.15,
    0.15,
    0.1,
    0.1,
    0.1, // 25 -> 26
    0.07,
    0.05,
    0.03,
    0.01,
    0.01, // 30 -> max
];
const neuronUpgradeDestroyChance = [
    0, // 0 -> 1
    0,
    0,
    0,
    0,
    0, // 5 -> 6
    0,
    0,
    0,
    0,
    0, // 10 -> 11
    0,
    0,
    0,
    0,
    0.01, // 15 -> 16
    0.01,
    0.04,
    0.04,
    0.06,
    0.07, // 20 -> 21
    0.08,
    0.15,
    0.16,
    0.17,
    0.18, // 25 -> 26
    0.19,
    0.2,
    0.2,
    0.2,
    0.2,  // 30 -> max
];

const neuronIntAddStat = [
    '아래 버튼을 눌러 강화를 도전하세요!',
    'INT +3',
    'INT +6',
    'INT +9',
    'INT +12',
    'INT +15',
    'INT +18',
    'INT +21',
    'INT +24',
    'INT +27',
    'INT +30',
    'INT +34',
    'INT +38',
    'INT +42',
    'INT +46',
    'INT +50',
    'INT +60',
    'INT +70',
    'INT +80',
    'INT +90',
    'INT +100',
    'INT +110',
    'INT +120',
    'INT +145',
    'INT +160',
    'INT +180',
    'INT +200',
    'INT +250',
    'INT +300',
    'INT +350',
    'INT +400',
    '모든 강화를 완료하였습니다. 당신은 잘 했습니다.',
];
const neuronIntMultStat = [
    'INT +0%',
    'INT +0%',
    'INT +0%',
    'INT +0%',
    'INT +0%',
    'INT +0%',
    'INT +0%',
    'INT +0%',
    'INT +0%',
    'INT +0%',
    'INT +2%',
    'INT +4%',
    'INT +6%',
    'INT +8%',
    'INT +10%',
    'INT +13%',
    'INT +16%',
    'INT +19%',
    'INT +22%',
    'INT +25%',
    'INT +33%',
    'INT +36%',
    'INT +40%',
    'INT +44%',
    'INT +48%',
    'INT +52%',
    'INT +56%',
    'INT +60%',
    'INT +70%',
    'INT +85%',
    'INT +100%',
    '모든 강화를 완료하였습니다. 당신은 잘 했습니다.',
];

export function upgradeNeuron(neuronLv: number): number {
    const upgradeSuccesChance = neuronUpgradeSuccessChance[neuronLv];
    const upgradeDestroyChance = neuronUpgradeDestroyChance[neuronLv];

    const rand = generateRandomNumber(1000);
    //console.log('rand: ' + rand);
    //console.log('upgradeSuccesChance * 1000: ' + upgradeSuccesChance * 1000);
    //console.log('1000 - upgradeDestroyChance * 1000: ' + (1000 - upgradeDestroyChance * 1000));
    if (rand < upgradeSuccesChance * 1000) {
        return neuronLv + 1;    
    } else if (rand > 1000 - upgradeDestroyChance * 1000) {
        return 12;
    }
    else {
        return neuronLv;
    }

}

export function printNeuronUI(neuronLv: number): string {
    let resultUI = '';

    const maxIntLv = 30;
    let starIndex = 0;
    for (let i = 0; i<neuronLv; i++) {
        resultUI += '★';
        starIndex++;
        if (starIndex % 5 == 0) {
            resultUI += ' ';
        }
        if (starIndex % 15 == 0) {
            resultUI += '\n';
        }
    }
    for (let i = 0; i<maxIntLv - neuronLv; i++) {
        resultUI += '☆';
        starIndex++;
        if (starIndex % 5 == 0) {
            resultUI += ' ';
        }
        if (starIndex % 15 == 0) {
            resultUI += '\n';
        }
    }

    resultUI += '\n------------ ★ **' + neuronLv + '성** -------------\n\n';
    resultUI += '- ' + neuronIntAddStat[neuronLv] + '\n';
    resultUI += '- ' + neuronIntMultStat[neuronLv] + '\n\n';
    resultUI += '- **✅ 성공: ' + (neuronUpgradeSuccessChance[neuronLv] * 100).toFixed(2) + '%**\n';
    resultUI += '- **❌ 실패(유지): ' + (100 - (neuronUpgradeSuccessChance[neuronLv] * 100 + neuronUpgradeDestroyChance[neuronLv] * 100)).toFixed(2) + '%**\n';
    resultUI += neuronUpgradeDestroyChance[neuronLv] != 0 ? '- **💀 파괴: ' + (neuronUpgradeDestroyChance[neuronLv] * 100).toFixed(2) + '%** (파괴시 12성)\n' : '';
    resultUI += '\n⭐ ' + (neuronLv + 1) + '성 강화 성공 시\n\n';
    resultUI += '- ' + neuronIntAddStat[neuronLv + 1] + '\n';
    resultUI += '- ' + neuronIntMultStat[neuronLv + 1] + '\n\n';

    return resultUI;
}

type NeuronData = {
    addStat: number,
    multStat: number
}

export function getNeuronDataByLv(neuronLv: number): NeuronData {
    const addStat = Number.parseInt(neuronIntAddStat[neuronLv].replace('INT +', '')) || 0;
    const multStat = Number.parseInt(neuronIntMultStat[neuronLv].replace('INT +', '').replace('%', '')) || 0;
    //console.log('addStat: ' + addStat);
    //console.log('multStat: ' + multStat);
    return {
        addStat: addStat,
        multStat: multStat
    };
}

function generateRandomNumber(max: number) {
    return crypto.randomInt(0, max);
}