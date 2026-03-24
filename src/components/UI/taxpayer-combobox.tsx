import React from 'react'
import { Input } from 'react-aria-components'
import { ComboBox } from 'react-aria-components'
import { Controller, Control } from 'react-hook-form'
import { Popover, Label, ListBox, ListBoxItem, Button } from 'react-aria-components'
import { useFilter } from 'react-aria'
import { Taxpayer } from '../../types/taxpayer'
import { EventFormData } from '../Events/event-form'
import { IvaReportFormData } from '../iva/iva-form'
import { IslrReportFormData } from '../ISLR/islr-form'




interface TaxPayerValues {
    control: Control<EventFormData | IvaReportFormData | IslrReportFormData>
    name: keyof EventFormData;
    label: string;
    taxpayers?: Taxpayer[]
}



function TaxpayerCombobox({ control, name, label, taxpayers = [] }: TaxPayerValues) {
    const { contains } = useFilter({ sensitivity: 'base' })
    const [showAll, setShowAll] = React.useState(false);

    // if (!taxpayers) {
    //     console.error("No taxpayers defined");
    //     return <div>No taxpayers</div>
    // }

    const [filterValue, setFilterValue] = React.useState('');



    const filteredItems = React.useMemo(() => {
        const result = taxpayers.filter(item =>
            contains(`${item.providenceNum} ${item.process} ${item.rif} ${item.name}`, filterValue)
        );

        return result;
    }, [taxpayers, filterValue, contains]);


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
                    selectedKey={typeof value === "object" && value !== null ? (value as unknown as Taxpayer).providenceNum : (value as string | number)}
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
                            w-full p-2 mb-0
                            hover:bg-white hover:border-black`} />
                        <Button className={"w-6 h-6 box-content p-0 text-xs bg-[#3498db] text-white -ml-9  mb-0"}>
                            ▼
                        </Button>
                    </div>
                    <Popover className={"w-[25rem] "}>
                        <ListBox<Taxpayer> ref={ref} className={"bg-white w-full rounded-2xl shadow-2xl border border-black overflow-y-scroll max-h-40"}>
                            {
                                item => (
                                    <ListBoxItem className="py-1 px-2 rounded-2xl transition duration-0 hover:duration-200 hover:bg-[#3498db] hover:-translate-y-1 hover:text-white" value={item} textValue={`${item.providenceNum} ${item.process} ${item.rif}`}>
                                        {item.name}
                                    </ListBoxItem>
                                )}
                        </ListBox>
                    </Popover>
                </ComboBox>
            )
            }
        />
    )
}

export default TaxpayerCombobox