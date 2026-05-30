import { get, post, del } from "../../../utils/request";

export type BankAccount = {
    id?: number;
    bank_name: string;
    account_name: string;
    account_number: string;
};

export async function getUserBankAccounts() {
    return get("/api/users/bank-accounts/");
}

export async function createUserBankAccount(data: BankAccount) {
    return post("/api/users/bank-accounts/", data);
}

export async function deleteUserBankAccount(id: number | string) {
    return del(`/api/users/bank-accounts/${id}/`);
}
