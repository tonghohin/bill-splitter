"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type Person = {
    id: number;
    name: string;
    amount: number | null;
};

type Settlement = {
    from: string;
    to: string;
    amount: number;
};

export function BillSplitter() {
    const [people, setPeople] = useState<Person[]>([]);
    const [newName, setNewName] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const { toast } = useToast();

    const addPerson = () => {
        if (newName) {
            const amount = newAmount ? parseFloat(newAmount) : null;
            if (amount !== null && amount < 0) {
                toast({
                    title: "Invalid Amount",
                    description: "The amount cannot be negative.",
                    variant: "destructive"
                });
                return;
            }
            setPeople([
                ...people,
                {
                    id: Date.now(),
                    name: newName,
                    amount: amount
                }
            ]);
            setNewName("");
            setNewAmount("");
        }
    };

    const removePerson = (id: number) => {
        setPeople(people.filter((person) => person.id !== id));
    };

    const calculateSplit = () => {
        if (people.length === 0) {
            setSettlements([]);
            return;
        }

        const total = people.reduce((sum, person) => sum + (person.amount || 0), 0);
        const perPerson = total / people.length;

        const balances = people.map((person) => ({
            name: person.name,
            balance: (person.amount || 0) - perPerson
        }));

        const newSettlements: Settlement[] = [];
        const debtors = balances.filter((b) => b.balance < 0).sort((a, b) => a.balance - b.balance);
        const creditors = balances.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);

        let debtorIndex = 0;
        let creditorIndex = 0;

        while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
            const debtor = debtors[debtorIndex];
            const creditor = creditors[creditorIndex];
            const amount = Math.min(-debtor.balance, creditor.balance);

            newSettlements.push({
                from: debtor.name,
                to: creditor.name,
                amount: Number(amount.toFixed(2))
            });

            debtor.balance += amount;
            creditor.balance -= amount;

            if (Math.abs(debtor.balance) < 0.01) debtorIndex++;
            if (Math.abs(creditor.balance) < 0.01) creditorIndex++;
        }

        setSettlements(newSettlements);
    };

    useEffect(() => {
        calculateSplit();
    }, [people]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-md">
            <Card className="w-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl sm:text-2xl font-bold">Bill Splitter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 space-y-4">
                        <div>
                            <Label htmlFor="name" className="text-sm font-medium">
                                Name
                            </Label>
                            <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter name" className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="amount" className="text-sm font-medium">
                                Amount (optional)
                            </Label>
                            <Input id="amount" type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="Enter amount (if any)" className="mt-1" />
                        </div>
                        <Button onClick={addPerson} className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Add Person
                        </Button>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">People and Expenses</h3>
                        {people.length > 0 ? (
                            <ul className="space-y-2">
                                {people.map((person) => (
                                    <li key={person.id} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                                        <span className="truncate mr-2 text-sm">
                                            {person.name}: {person.amount !== null ? `$${person.amount.toFixed(2)}` : "No expenses"}
                                        </span>
                                        <Button variant="destructive" size="icon" onClick={() => removePerson(person.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <Alert>
                                <AlertDescription>Start by adding people and their expenses. The bill split will be calculated automatically.</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Settlements</h3>
                        {settlements.length > 0 ? (
                            <ul className="space-y-2">
                                {settlements.map((settlement, index) => (
                                    <li key={index} className="p-2 bg-secondary rounded-md text-sm">
                                        <span className="font-medium">{settlement.from}</span> owes <span className="font-medium">{settlement.to}</span>:<span className="ml-1 font-bold">${settlement.amount.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <Alert>
                                <AlertDescription>{people.length > 0 ? "No settlements needed. Everyone has paid their fair share." : "Settlements will appear here once you've added people and expenses."}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
