import React from 'react';
import { Controller } from 'react-hook-form';
import {
    DatePicker,
    Label,
    Group,
    DateInput,
    DateSegment,
    Popover,
    Dialog,
    Calendar,
    CalendarGrid,
    CalendarCell,
    Heading,
    Button as AriaButton,
} from 'react-aria-components';
import { Control } from 'react-hook-form';
import { parseDate } from '@internationalized/date';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

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
                fieldState: { invalid },
            }) => {
                const parsedValue = typeof value === "string" ? parseDate(value) : value ?? undefined;

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
                        {label && (
                            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                                {label}
                            </Label>
                        )}

                        {/* Input group */}
                        <Group
                            className={`
                                flex items-center w-full h-11 px-3 gap-2
                                bg-slate-900/50 border rounded-xl
                                transition-all duration-150
                                focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-500/20
                                ${invalid
                                    ? 'border-rose-500/50 bg-rose-500/5'
                                    : 'border-slate-700 hover:border-slate-600'
                                }
                            `}
                        >
                            <CalendarIcon className="w-4 h-4 text-slate-500 shrink-0" />
                            <DateInput
                                className="flex flex-1 items-center gap-0.5 [&_.react-aria-DateSegment]:text-slate-200 [&_.react-aria-DateSegment[data-placeholder]]:text-slate-500 [&_.react-aria-DateSegment]:px-0.5 [&_.react-aria-DateSegment]:rounded [&_.react-aria-DateSegment:focus]:bg-indigo-500/30 [&_.react-aria-DateSegment:focus]:outline-none"
                                ref={ref}
                            >
                                {(segment) => <DateSegment segment={segment} />}
                            </DateInput>

                            {/* Calendar toggle button */}
                            <AriaButton className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-slate-700/60 hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors text-xs">
                                ▼
                            </AriaButton>
                        </Group>

                        {/* Calendar popover */}
                        <Popover className="z-50">
                            <Dialog className="outline-none">
                                <Calendar className="bg-slate-900 border border-slate-700 shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl p-4 w-[280px]">
                                    {/* Nav header */}
                                    <header className="flex items-center justify-between mb-3">
                                        <AriaButton
                                            slot="previous"
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </AriaButton>
                                        <Heading className="text-sm font-semibold text-white" />
                                        <AriaButton
                                            slot="next"
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </AriaButton>
                                    </header>

                                    <CalendarGrid className="w-full [&_thead_th]:text-[10px] [&_thead_th]:font-bold [&_thead_th]:text-slate-500 [&_thead_th]:uppercase [&_thead_th]:pb-2 [&_thead_th]:text-center">
                                        {(date) => (
                                            <CalendarCell
                                                date={date}
                                                className="
                                                    w-9 h-9 flex items-center justify-center text-xs text-slate-300 rounded-lg
                                                    cursor-pointer select-none transition-all duration-150
                                                    hover:bg-indigo-500/20 hover:text-white
                                                    data-[selected]:bg-indigo-500 data-[selected]:text-white data-[selected]:font-bold
                                                    data-[today]:ring-1 data-[today]:ring-indigo-400/50
                                                    data-[outside-month]:text-slate-600
                                                    data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed
                                                    focus:outline-none focus:ring-2 focus:ring-indigo-400/40
                                                "
                                            />
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
