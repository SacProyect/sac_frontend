interface TextInputProps {
    register: any;
    type?: string;
    placeholder?: string;
}

function TextInput({ register, type = 'text', placeholder }: TextInputProps) {
<<<<<<< HEAD
    // Destructure onChange from the register object and keep the rest of the properties.
    const { onChange: originalOnChange, ...restRegister } = register;

=======
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
    // Handle decimal validation only for 'number' type input
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (type === 'number') {
            const inputValue = e.target.value;

            // Allow only valid decimal values (numbers with up to two decimal places)
            if (/^\d*\.?\d{0,2}$/.test(inputValue)) {
                e.target.value = inputValue;  // Update the value of the input field directly
            }
        }
<<<<<<< HEAD

        if (type == "password") {
            originalOnChange(e);
        }
=======
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
    };

    // Determine if this is a number input and allow decimals
    const stepValue = type === 'number' ? '0.01' : undefined;

    return (
        <input
            type={type}
            {...register}
            className="w-full p-2 border border-[#ccc] rounded-lg bg-slate-50 text-black cursor-pointer"
            placeholder={placeholder}
            onChange={handleChange}  // Use the handleChange function for validation
            step={stepValue}  // Allow decimal values for number type input
        />
    );
}

export default TextInput;
