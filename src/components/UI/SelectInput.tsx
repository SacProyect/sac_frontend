// import React from 'react'
import { Label } from 'react-aria-components'
import { SelectValue } from 'react-aria-components'
import { ListBoxItem } from 'react-aria-components'
import { Popover } from 'react-aria-components'
import { Button } from 'react-aria-components'
import { Select } from 'react-aria-components'
import { ListBox } from 'react-aria-components'
import { Controller } from 'react-hook-form'
<<<<<<< HEAD
=======
import InputButton from './InputButton'
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)

export interface Item {
    id: string;
    name: string;
    value: string;
}

interface SelectInputProps {
    control: import('react-hook-form').Control<any>;
    name: string;
    items?: Item[];
    label: string;
}

const SelectInput: React.FC<SelectInputProps> = ({ control, name, items = [], label }) => {
    return (
        <Controller
            control={control}
            name={name}
            rules={{ required: "Este campo es obligatorio" }}
            render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error }
            }) => (
                <Select
                    name={name}
                    onSelectionChange={(selectedKey) => {
                        // We need to find the corresponding item based on `selectedKey`
<<<<<<< HEAD
                        const selectedItem = items.find(item => item.value === selectedKey);
                        if (selectedItem) onChange(selectedItem.value);
=======
                        const selectedItem = items.find(item => item.id === selectedKey);
                        if (selectedItem) {
                            onChange(selectedItem.value); // Send the correct value (string) like "SPECIAL"
                        }
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
                    }}
                    selectedKey={value} // This is the key that is selected (string, corresponding to the `id`)
                    onBlur={onBlur}
                    isRequired
                    validationBehavior="aria"
                    isInvalid={invalid}
                    placeholder='Seleccione un item'
<<<<<<< HEAD
                    defaultSelectedKey={items.length > 0 ? items[0].value : undefined}
                    className=""
                >
                    <Label className="block text-xs font-medium text-slate-700 mb-1">{label}</Label>
                    <Button
                        className={`     
                            flex text-xs items-center
                            border border-[#ccc]
                            rounded-lg bg-slate-50
                            w-full px-2 py-1 mt-0
                            hover:bg-white hover:border-black hover:border-1
                            justify-between gap-2`}
                    >
                        <SelectValue
                            ref={ref}
                            className="font-normal flex-1 min-w-0 truncate text-slate-900 data-[placeholder]:text-slate-400"
                        />
                        {/* Avoid nested <button> which causes DOM nesting/hydration warnings */}
                        <span
                            aria-hidden="true"
                            className="w-6 h-6 box-content p-0 text-xs bg-[#3498db] text-white inline-flex items-center justify-center rounded flex-shrink-0"
                        >
                            ▼
                        </span>
                    </Button>
                    {/* Match dropdown width to trigger width */}
                    <Popover className="w-[--trigger-width] max-w-[90vw] z-50">
                        <ListBox
                            className="bg-white w-full rounded-lg shadow-xl border border-slate-200 overflow-y-auto max-h-52 p-1 text-xs text-slate-900"
=======
                    defaultSelectedKey={items.length > 0 ? items[0].id : undefined}
                    className=""
                >
                    <Label>{label}</Label>
                    <Button
                        className={`     
                            flex  text-xs   items-center                   
                            border-[#ccc] border
                            rounded-lg bg-slate-50
                            w-full p-1 mt-0
                            hover:bg-white hover:border-black hover:border-1
                            justify-between`}
                    >
                        <SelectValue ref={ref} className={"font-normal"} />
                        <InputButton onPress={() => { }} >▼</InputButton>
                    </Button>
                    <Popover className={"w-[25rem]"}>
                        <ListBox
                            className={"bg-white w-full rounded-2xl shadow-2xl border border-black overflow-y-scroll max-h-44"}
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
                            items={items}
                        >
                            {
                                item =>
                                    <ListBoxItem
<<<<<<< HEAD
                                        className="px-2 py-1.5 rounded-md cursor-pointer outline-none data-[hovered]:bg-sky-100 data-[focused]:bg-sky-100 data-[selected]:bg-[#3498db] data-[selected]:text-white"
=======
                                        className="py-1 px-2 rounded-2xl transition duration-0 hover:duration-200 hover:bg-[#3498db] hover:-translate-y-1 cursor-pointer"
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
                                        value={item}
                                        key={item.value}
                                    >
                                        {item.name}
                                    </ListBoxItem>
                            }
                        </ListBox>
                    </Popover>
                </Select>
            )}
        />
    )
}

export default SelectInput