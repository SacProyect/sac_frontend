import React from 'react'
import { Input } from 'react-aria-components'
import { ComboBox } from 'react-aria-components'
import { Controller } from 'react-hook-form'
import { Label } from 'react-aria-components'
import { Popover } from 'react-aria-components'
import { ListBox } from 'react-aria-components'
import { ListBoxItem } from 'react-aria-components'
import { useFilter } from 'react-aria'
import { Button } from 'react-aria-components'

function TaxpayerCombobox({ control, name, label, taxpayers = [] }) {
    const { contains } = useFilter({ sensitivity: 'base' })
    const [showAll, setShowAll] = React.useState(false);
    const [filterValue, setFilterValue] = React.useState('');
    const filteredItems = React.useMemo(
        () => taxpayers.filter((item) => contains(`${item.nroProvidencia} ${item.procedimiento} ${item.rif}`, filterValue)),
        [taxpayers, filterValue]
    )
    return (
        <Controller
            control={control}
            name={name}
            rules={{ required: "Este campo es obligatorio" }}
            render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error }
            }) => (
                <ComboBox
                    onSelectionChange={onChange}

                    onInputChange={(value) => {
                        setShowAll(false);
                        setFilterValue(value);
                    }}
                    onOpenChange={(isOpen, menuTrigger) => {
                        if (menuTrigger === 'manual' && isOpen) {
                            setShowAll(true);
                        }
                    }}
                    name={name}
                    value={value}
                    onBlur={onBlur}
                    isRequired
                    validationBehavior="aria"
                    isInvalid={invalid}
                    items={filteredItems}
                >
                    <Label>{label}</Label>

                    <div className='flex items-center'>
                        <Input className={`                            
                            border-[#ccc] border
                            rounded-lg bg-slate-50
                            w-full p-2 mb-4
                            hover:bg-white hover:border-black`} />
                        <Button className={"w-6 h-6 box-content p-0 text-xs bg-[#3498db] text-white -ml-9  mb-4"}>
                            ▼
                        </Button>
                    </div>
                    <Popover className={"w-[25rem] "}>
                        <ListBox ref={ref} className={"bg-white w-full rounded-2xl shadow-2xl border border-black"}>
                            {
                                item =>
                                    <ListBoxItem className="py-1 px-2 rounded-2xl transition duration-0 hover:duration-200 hover:bg-[#3498db] hover:-translate-y-1 hover:text-white" value={`${item.id}`} textValue={`${item.nroProvidencia} ${item.procedimiento} ${item.rif}`}>
                                        {item.nroProvidencia} {item.procedimiento} {item.rif}
                                    </ListBoxItem>
                            }
                        </ListBox>
                    </Popover>
                </ComboBox>
            )
            }
        />
    )
}

export default TaxpayerCombobox