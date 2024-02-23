import { ExportOutlined, ImportOutlined } from '@ant-design/icons';
import { Button, Select, message } from 'antd';
import React, { useRef } from 'react';
import { v4 } from 'uuid';

import { exportExcelFile, readFromExcel } from '../../helpers/excel-file-utils';
import type { DecisionNode } from '../decision-graph';
import { Stack } from '../stack';
import {
  useDecisionTableActions,
  useDecisionTableRaw,
  useDecisionTableState,
  type TableExportOptions,
} from './context/dt-store.context';

export const DecisionTableCommandBar: React.FC = () => {
  const tableActions = useDecisionTableActions();
  const { disableHitPolicy, disabled, configurable, decisionTable } = useDecisionTableState(
    ({ disableHitPolicy, disabled, configurable, decisionTable }) => ({
      disableHitPolicy,
      disabled,
      configurable,
      decisionTable,
    }),
  );

  const { listenerStore } = useDecisionTableRaw();
  const fileInput = useRef<HTMLInputElement>(null);

  const exportExcel = async (options: TableExportOptions) => {
    const { name } = options;

    try {
      await exportExcelFile(name, [{ ...decisionTable, name: 'decision table', id: v4() }]);
      message.success('Excel file has been downloaded successfully!');
    } catch {
      message.error('Failed to download Excel file!');
    }
  };

  const importExcel = () => {
    fileInput?.current?.click?.();
  };

  const readExcelFile = async (event: any) => {
    const file = event?.target?.files[0];
    const reader = new FileReader();

    try {
      reader.readAsArrayBuffer(file);
      reader.onload = async () => {
        const buffer = reader.result as ArrayBuffer;

        if (!buffer) return;

        const nodes: DecisionNode[] = await readFromExcel(buffer);
        const newTable = nodes[0].content;

        tableActions.setDecisionTable(newTable);
        listenerStore.getState().onChange?.(newTable);
      };
      message.success('Excel file has been uploaded successfully!');
    } catch {
      message.error('Failed to upload Excel!');
    }
  };

  return (
    <>
      <Stack horizontal horizontalAlign={'space-between'} verticalAlign={'center'} className={'grl-dt__command-bar'}>
        <Stack gap={8} horizontal className='full-width'>
          <Button
            type='text'
            size={'small'}
            color='secondary'
            icon={<ExportOutlined />}
            onClick={() => exportExcel({ name: 'table' })}
          >
            Export Excel
          </Button>
          <Button
            type='text'
            size={'small'}
            color='secondary'
            disabled={disabled}
            icon={<ImportOutlined />}
            onClick={() => importExcel()}
          >
            Import Excel
          </Button>
        </Stack>
        <Select
          style={{ width: 140 }}
          size={'small'}
          disabled={disabled || !configurable || disableHitPolicy}
          value={decisionTable.hitPolicy}
          onSelect={tableActions.updateHitPolicy}
          options={[
            {
              key: 'first',
              label: 'First',
              value: 'first',
            },
            {
              key: 'collect',
              label: 'Collect',
              value: 'collect',
            },
          ]}
        />
      </Stack>
      <input
        multiple
        hidden
        accept='.xlsx'
        type='file'
        ref={fileInput}
        onChange={readExcelFile}
        onClick={(event) => {
          (event.target as any).value = null;
        }}
      />
    </>
  );
};
