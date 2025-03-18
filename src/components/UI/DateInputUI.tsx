import React from 'react';
import { Controller } from 'react-hook-form';
import { DatePicker } from 'react-aria-components';
import { Label } from 'react-aria-components';
import { Group } from 'react-aria-components';
import { DateInput } from 'react-aria-components';
import { Popover } from 'react-aria-components';
import { Dialog } from 'react-aria-components';
import { Calendar } from 'react-aria-components';
import { Heading } from 'react-aria-components';
import { CalendarGrid } from 'react-aria-components';
import { CalendarCell } from 'react-aria-components';
import { DateSegment } from 'react-aria-components';
import InputButton from './InputButton';
import { Control } from 'react-hook-form';
import { parseDate } from '@internationalized/date'; // Use parseDate

interface DateInputUIProps {
    control: Control<any>;
    name: string;
    label: string;
}

function DateInputUI({ control, name, label }: DateInputUIProps) {
    return (
        <Controller
            control={control}
            name={name}
            rules={{ required: "Este campo es obligatorio" }}
            render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error }
            }) => {
                // Use parseDate instead of parseZonedDateTime if your value is just a date
                const parsedValue = typeof value === "string" ? parseDate(value) : undefined;

                return (
                    <DatePicker
                        onChange={onChange}
                        name={name}
                        value={parsedValue}
                        onBlur={onBlur}
                        isRequired
                        validationBehavior="aria"
                        granularity="day"
                        isInvalid={invalid}
                    >
                        <Label>{label}</Label>
                        <Group
                            className={`
                flex items-center whitespace-nowrap
                border-[#ccc] border rounded-lg bg-slate-50
                w-full p-2 mb-4 justify-between`}
                        >
                            <DateInput className="flex" ref={ref}>
                                {(segment) => <DateSegment segment={segment} />}
                            </DateInput>
                            <InputButton>▼</InputButton>
                        </Group>
                        <Popover>
                            <Dialog>
                                <Calendar className="h-56 bg-white border border-black shadow-2xl w-60 rounded-2xl">
                                    <header className="flex justify-between w-full px-4 pt-2">
                                        <InputButton slot="previous">◀</InputButton>
                                        <Heading />
                                        <InputButton slot="next">▶</InputButton>
                                    </header>
                                    <CalendarGrid className="w-full px-4">
                                        {(date) => (
                                            <CalendarCell className="self-center text-center hover:bg-[#3498db] hover:text-white rounded-lg hover:-translate-y-1" date={date} />
                                        )}
                                    </CalendarGrid>
                                </Calendar>
                            </Dialog>
                        </Popover>
                    </DatePicker>
                );
            }}
        />
    );
}

export default DateInputUI;
