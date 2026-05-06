import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0001_initial'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='MonthlyUsage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('year', models.IntegerField()),
                ('month', models.IntegerField()),
                ('messages_used', models.IntegerField(default=0)),
                ('client', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='monthly_usage',
                    to='accounts.clientprofile',
                )),
            ],
            options={
                'db_table': 'monthly_usage',
            },
        ),
        migrations.AlterUniqueTogether(
            name='monthlyusage',
            unique_together={('client', 'year', 'month')},
        ),
        migrations.AddIndex(
            model_name='monthlyusage',
            index=models.Index(fields=['client', 'year', 'month'], name='monthly_usa_client__idx'),
        ),
    ]
