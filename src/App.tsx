import { memo, useCallback, useState } from "react";

import "./App.css";

interface ButtonProps {
  onIncrease: () => void;
}

const Button = memo(function Button({ onIncrease }: ButtonProps) {
  return (
    <button type="button" className="counter" onClick={onIncrease}>
      Increase
    </button>
  );
});

interface LabelProps {
  count: number;
}

function Label({ count }: LabelProps) {
  return <p className="label">Count is {count}</p>;
}

function App() {
  const [count, setCount] = useState<number>(0);

  const increase = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  return (
    <>
      <Label count={count} />
      <Button onIncrease={increase} />
    </>
  );
}

export default App;
