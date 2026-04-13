import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const InputWithAdd = () => {
    const [result, setResult] = useState<string[]>([]);

    return (
        <div className="relative w-full">
            <Input className="text-lg!" />
            <div className="absolute b-0 w-full">
                {result.length === 0 ? (
                    <Button variant="outline" />
                ) : (
                    <div>Risultati</div>
                )}
            </div>
        </div>
    );
};

export default InputWithAdd;