import React from 'react'
import { Label } from 'react-aria-components'
import { SelectValue } from 'react-aria-components'
import { ListBoxItem } from 'react-aria-components'
import { Popover } from 'react-aria-components'
import { Button } from 'react-aria-components'
import { Select } from 'react-aria-components'
import { ListBox } from 'react-aria-components'
import { Controller } from 'react-hook-form'
import InputButton from './InputButton'

const SelectInput = ({ control, name, items = [], label }) => {
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
                    onSelectionChange={onChange}
                    value={value}
                    onBlur={onBlur}
                    isRequired
                    validationBehavior="aria"
                    isInvalid={invalid}
                    placeholder='Seleccione un item'
                    defaultSelectedKey={items.length > 0 ? items[0].id : undefined}
                >
                    <Label>{label}</Label>
                    <Button
                        className={`     
                            flex  text-base                     
                            border-[#ccc] border
                            rounded-lg bg-slate-50
                            w-full p-2 mb-4
                            hover:bg-white hover:border-black hover:border-1
                            justify-between`}
                    >
                        <SelectValue ref={ref} className={"font-normal"} />
                        <InputButton onPress={() => { }} >▼</InputButton>
                    </Button>
                    <Popover className={"w-[25rem]"}>
                        <ListBox
                            className={"bg-white w-full rounded-2xl shadow-2xl border border-black overflow-y-scroll max-h-44"}
                            items={items}
                        >
                            {
                                item =>
                                    <ListBoxItem
                                        className="py-1 px-2 rounded-2xl transition duration-0 hover:duration-200 hover:bg-[#3498db] hover:-translate-y-1 cursor-pointer"
                                        value={item.value}
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