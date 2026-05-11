export type BrainRow = {
    discord_user_id: string;
    dt_created: Date;
    dt_modified: Date;
    br_lv: number;
    br_neuron_lv: number;
    br_potential: string;
    br_iq: string;
    br_synapse: number;
    br_evolved: number;
};
  
export type Brain = {
    discordUserId: string;
    dtCreated: Date;
    dtModified: Date;
    brLv: number;
    brNeuronLv: number;
    brPotential: string;
    brIq: string;
    brSynapse: number;
    brEvolved: boolean;
};