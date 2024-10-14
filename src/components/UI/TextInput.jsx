import React from 'react'

function TextInput({ register, type = 'text', placeholder }) {
    return (
        <input
            type={type}
            {...register}
            className="w-full p-2 mb-4 border border-[#ccc] rounded-lg bg-slate-50 text-black cursor-pointer"
            placeholder={placeholder}
        />
    )
}

export default TextInput