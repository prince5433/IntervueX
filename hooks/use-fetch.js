/*
 * File Overview:
 * Use Case: Reusable async state hook: loading/error/data handling + toast feedback.
 * Project Role: Client-side server action invocation ko consistent banata hai aur repetitive boilerplate hatata hai.
 * Typical Trigger: Jab koi client component async action ko managed state ke saath call karta hai.
 * File Path: hooks/use-fetch.js
 */
import { useState } from "react";
import { toast } from "sonner";

const useFetch = (cb) => {
  // Note: async callback ka latest response store hoga.
  const [data, setData] = useState(undefined);
  // Note: request in-progress state.
  const [loading, setLoading] = useState(false);
  // Note: error object/message yahan track hota hai.
  const [error, setError] = useState(null);

  const fn = async (...args) => {
    // Note: request start hote hi loading true aur stale error clear.
    setLoading(true);
    setError(null);

    try {
      // Note: provided callback ko dynamic args ke saath execute karte hain.
      const response = await cb(...args);
      // Note: success par data update.
      setData(response);
      // Note: defensive clear, taaki previous fail ka error na dikhe.
      setError(null);
    } catch (error) {
      // Note: fail par local error state set.
      setError(error);
      // Note: UI toast se user ko instant feedback.
      toast.error(error.message);
    } finally {
      // Note: success/fail dono cases me loading false.
      setLoading(false);
    }
  };

  // Note: caller ko state + trigger fn + manual setData expose karte hain.
  return { data, loading, error, fn, setData };
};

export default useFetch;
