import React, { useState } from 'react';

import CreatableSelect from 'react-select/creatable';


const createOption = (label) => ({
  label,
  value: label,
});

function CustomSelect(props){
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState(props.defaultOptions);

    const handleCreate = (inputValue) => {
        setIsLoading(true);
        setTimeout(() => {
        const newOption = createOption(inputValue);
        setIsLoading(false);
        setOptions((prev) => [...prev, newOption]);
        props.setValue(newOption);
        }, 1000);
    };
    return (
        <CreatableSelect
            isClearable
            isDisabled={isLoading}
            isLoading={isLoading}
            onChange={(newValue) => props.setValue(newValue)}
            onCreateOption={handleCreate}
            options={options}
            value={props.value}
            defaultValue={props.defaultValue}
        />
    )
}

export default CustomSelect;